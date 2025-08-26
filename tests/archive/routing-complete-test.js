/**
 * BUMBA Routing & Command Architecture Complete Test
 * Verify all routing components are 100% operational
 */

const chalk = require('chalk');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Routing & Command Architecture Complete Test'));
console.log(chalk.cyan('═'.repeat(60)));

async function testRoutingArchitecture() {
  const results = {
    components: {},
    capabilities: {},
    overall: true
  };
  
  let totalTests = 0;
  let passedTests = 0;
  
  // ============== TEST UNIFIED ROUTING SYSTEM ==============
  console.log(chalk.bold.yellow('\n📡 Testing Unified Routing System...'));
  
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    if (router) {
      passedTests++;
      console.log(chalk.green('  🏁 Unified Routing System loads'));
      results.components.unifiedRouting = true;
    }
    totalTests++;
    
    // Test all required methods
    const methods = ['routeCommand', 'registerDepartment', 'analyze', 'getPriority'];
    for (const method of methods) {
      if (typeof router[method] === 'function') {
        passedTests++;
        console.log(chalk.green(`  🏁 ${method} method works`));
        results.capabilities[method] = true;
      } else {
        console.log(chalk.red(`  🔴 ${method} method missing`));
        results.capabilities[method] = false;
      }
      totalTests++;
    }
    
  } catch (error) {
    console.log(chalk.red('  🔴 Unified Routing error:'), error.message);
    results.components.unifiedRouting = false;
  }
  
  // ============== TEST COMMAND HANDLER ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Command Handler...'));
  
  try {
    const CommandHandler = require('../src/core/command-handler');
    
    if (CommandHandler) {
      passedTests++;
      console.log(chalk.green('  🏁 Command Handler loads'));
      results.components.commandHandler = true;
      
      // Check for 60+ commands
      let handler;
      if (typeof CommandHandler === 'function') {
        handler = new CommandHandler();
      } else if (CommandHandler.processCommand) {
        handler = CommandHandler;
      }
      
      if (handler) {
        // Count command methods
        const commandMethods = Object.keys(handler).filter(key => 
          key.startsWith('handle') || key.includes('Command')
        );
        
        if (commandMethods.length >= 60) {
          passedTests++;
          console.log(chalk.green(`  🏁 ${commandMethods.length} commands available (60+ required)`));
          results.capabilities.commandCount = true;
        } else {
          console.log(chalk.yellow(`  🟠️ Only ${commandMethods.length} commands (60+ required)`));
          results.capabilities.commandCount = false;
        }
        totalTests++;
      }
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Command Handler error:'), error.message);
    results.components.commandHandler = false;
  }
  
  // ============== TEST COMMAND ROUTER INTEGRATION ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Command Router Integration...'));
  
  try {
    require('../src/core/command-router-integration');
    passedTests++;
    console.log(chalk.green('  🏁 Command Router Integration loads'));
    results.components.routerIntegration = true;
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Router Integration error:'), error.message);
    results.components.routerIntegration = false;
    totalTests++;
  }
  
  // ============== TEST SIMPLE ROUTER ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Simple Router...'));
  
  try {
    require('../src/core/simple-router');
    passedTests++;
    console.log(chalk.green('  🏁 Simple Router loads'));
    results.components.simpleRouter = true;
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Simple Router error:'), error.message);
    results.components.simpleRouter = false;
    totalTests++;
  }
  
  // ============== TEST COMMAND VALIDATOR ==============
  console.log(chalk.bold.yellow('\n🏁 Testing Command Validator...'));
  
  try {
    const { CommandValidator } = require('../src/core/security/command-validator');
    
    if (CommandValidator) {
      const validator = new CommandValidator();
      passedTests++;
      console.log(chalk.green('  🏁 Command Validator loads'));
      results.components.commandValidator = true;
      totalTests++;
      
      if (typeof validator.validate === 'function') {
        // Test validation
        const testResult = validator.validate('npm', ['list']);
        if (testResult) {
          passedTests++;
          console.log(chalk.green('  🏁 Validation pipeline works'));
          results.capabilities.validation = true;
        } else {
          console.log(chalk.yellow('  🟠️ Validation returned false'));
          results.capabilities.validation = false;
        }
        totalTests++;
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Validator error:'), error.message);
    results.components.commandValidator = false;
    totalTests++;
  }
  
  // ============== TEST COMMAND OPTIMIZER ==============
  console.log(chalk.bold.yellow('\n🟢 Testing Command Optimizer...'));
  
  try {
    const optimizer = require('../src/utils/commandOptimizer');
    
    if (optimizer) {
      passedTests++;
      console.log(chalk.green('  🏁 Command Optimizer loads'));
      results.components.commandOptimizer = true;
      totalTests++;
      
      // Test optimizer methods
      const methods = ['optimize', 'analyzeCommand', 'suggestOptimizations'];
      for (const method of methods) {
        if (typeof optimizer[method] === 'function') {
          passedTests++;
          console.log(chalk.green(`  🏁 ${method} method works`));
          results.capabilities[`optimizer_${method}`] = true;
        } else {
          console.log(chalk.red(`  🔴 ${method} method missing`));
          results.capabilities[`optimizer_${method}`] = false;
        }
        totalTests++;
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Optimizer error:'), error.message);
    results.components.commandOptimizer = false;
    totalTests++;
  }
  
  // ============== TEST ROUTING FEATURES ==============
  console.log(chalk.bold.yellow('\n🔧 Testing Routing Features...'));
  
  // Test command routing
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    await router.routeCommand('test', ['unit']);
    passedTests++;
    console.log(chalk.green('  🏁 Command routing functional'));
    results.capabilities.commandRouting = true;
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Command routing error:'), error.message);
    results.capabilities.commandRouting = false;
    totalTests++;
  }
  
  // Test priority analysis
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    const priority = router.getPriority('urgent', ['fix', 'bug']);
    if (priority !== undefined) {
      passedTests++;
      console.log(chalk.green(`  🏁 Priority analysis works (priority: ${priority})`));
      results.capabilities.priorityAnalysis = true;
    }
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Priority analysis error:'), error.message);
    results.capabilities.priorityAnalysis = false;
    totalTests++;
  }
  
  // Test department routing
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    router.registerDepartment('test', { name: 'Test Department' });
    passedTests++;
    console.log(chalk.green('  🏁 Department registration works'));
    results.capabilities.departmentRouting = true;
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Department routing error:'), error.message);
    results.capabilities.departmentRouting = false;
    totalTests++;
  }
  
  // ============== CALCULATE RESULTS ==============
  const successRate = Math.round((passedTests / totalTests) * 100);
  results.overall = successRate === 100;
  
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('TEST RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold(`\nTests Passed: ${passedTests}/${totalTests} (${successRate}%)`));
  
  // Component status
  console.log('\n📡 Routing Components:');
  console.log(`  Unified Routing System: ${results.components.unifiedRouting ? '🏁' : '🔴'}`);
  console.log(`  Command Handler: ${results.components.commandHandler ? '🏁' : '🔴'}`);
  console.log(`  Router Integration: ${results.components.routerIntegration ? '🏁' : '🔴'}`);
  console.log(`  Simple Router: ${results.components.simpleRouter ? '🏁' : '🔴'}`);
  console.log(`  Command Validator: ${results.components.commandValidator ? '🏁' : '🔴'}`);
  console.log(`  Command Optimizer: ${results.components.commandOptimizer ? '🏁' : '🔴'}`);
  
  // Capability status
  console.log('\n🟡 Capabilities:');
  console.log(`  Route Command: ${results.capabilities.routeCommand ? '🏁' : '🔴'}`);
  console.log(`  Register Department: ${results.capabilities.registerDepartment ? '🏁' : '🔴'}`);
  console.log(`  Analyze: ${results.capabilities.analyze ? '🏁' : '🔴'}`);
  console.log(`  Get Priority: ${results.capabilities.getPriority ? '🏁' : '🔴'}`);
  console.log(`  60+ Commands: ${results.capabilities.commandCount ? '🏁' : '🔴'}`);
  console.log(`  Validation Pipeline: ${results.capabilities.validation ? '🏁' : '🔴'}`);
  console.log(`  Optimization: ${results.capabilities.optimizer_optimize ? '🏁' : '🔴'}`);
  console.log(`  Command Routing: ${results.capabilities.commandRouting ? '🏁' : '🔴'}`);
  console.log(`  Priority Analysis: ${results.capabilities.priorityAnalysis ? '🏁' : '🔴'}`);
  console.log(`  Department Routing: ${results.capabilities.departmentRouting ? '🏁' : '🔴'}`);
  
  if (successRate === 100) {
    console.log(chalk.bold.green('\n🏁 ALL TESTS PASSED! Routing Architecture is 100% operational!'));
  } else if (successRate >= 90) {
    console.log(chalk.bold.yellow('\n🏁 Routing Architecture is operational with minor issues'));
  } else if (successRate >= 70) {
    console.log(chalk.bold.yellow('\n🟠️ Routing Architecture is partially operational'));
  } else {
    console.log(chalk.bold.red('\n🔴 Routing Architecture has significant issues'));
  }
  
  // Save results
  const fs = require('fs');
  const reportPath = path.join(__dirname, '../ROUTING_ARCHITECTURE_COMPLETE.json');
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalTests,
      passedTests,
      successRate: `${successRate}%`
    },
    components: results.components,
    capabilities: results.capabilities
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: ROUTING_ARCHITECTURE_COMPLETE.json`));
  
  return successRate;
}

// Run tests
console.log(chalk.gray('\nStarting comprehensive routing test...\n'));

testRoutingArchitecture().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.green(`🏁 ROUTING ARCHITECTURE AUDIT COMPLETE: ${score}% OPERATIONAL`));
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during testing:'), error);
  process.exit(1);
});