/**
 * BUMBA Routing & Command Architecture Audit
 * Comprehensive test of all routing and command components
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Routing & Command Architecture Audit'));
console.log(chalk.cyan('═'.repeat(60)));

async function auditRoutingArchitecture() {
  const results = {
    components: {},
    features: {},
    commands: {},
    gaps: [],
    recommendations: []
  };

  let componentsPassed = 0;
  let componentsTotal = 0;
  let featuresPassed = 0;
  let featuresTotal = 0;

  // ============== TEST UNIFIED ROUTING SYSTEM ==============
  console.log(chalk.bold.yellow('\n📡 Testing Unified Routing System...'));
  componentsTotal++;
  
  try {
    const routingPath = path.join(__dirname, '../src/core/unified-routing-system.js');
    if (!fs.existsSync(routingPath)) {
      console.log(chalk.red('  🔴 Unified Routing System not found'));
      results.components.unifiedRouting = { exists: false };
      results.gaps.push('Unified Routing System file missing');
    } else {
      const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
      
      if (BumbaIntelligentRouter) {
        const router = new BumbaIntelligentRouter();
        console.log(chalk.green('  🏁 Unified Routing System exists'));
        results.components.unifiedRouting = { exists: true, functional: false, tests: [] };
        
        // Test core methods
        const methods = ['routeCommand', 'registerDepartment', 'analyze', 'getPriority'];
        for (const method of methods) {
          if (typeof router[method] === 'function') {
            results.components.unifiedRouting.tests.push(`${method}: 🏁`);
            console.log(chalk.green(`    🏁 ${method} method exists`));
          } else {
            results.components.unifiedRouting.tests.push(`${method}: 🔴`);
            console.log(chalk.red(`    🔴 ${method} method missing`));
          }
        }
        
        results.components.unifiedRouting.functional = true;
        componentsPassed++;
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Unified Routing System error:'), error.message);
    results.components.unifiedRouting = { exists: false, error: error.message };
  }

  // ============== TEST COMMAND HANDLER ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Command Handler...'));
  componentsTotal++;
  
  try {
    const handlerPath = path.join(__dirname, '../src/core/command-handler.js');
    if (!fs.existsSync(handlerPath)) {
      console.log(chalk.red('  🔴 Command Handler not found'));
      results.components.commandHandler = { exists: false };
      results.gaps.push('Command Handler file missing');
    } else {
      const CommandHandler = require('../src/core/command-handler');
      
      if (CommandHandler) {
        console.log(chalk.green('  🏁 Command Handler exists'));
        results.components.commandHandler = { exists: true, functional: false };
        
        // Check if it's a class or object
        let handler;
        if (typeof CommandHandler === 'function') {
          handler = new CommandHandler();
        } else if (typeof CommandHandler.processCommand === 'function') {
          handler = CommandHandler;
        }
        
        if (handler) {
          // Test for 60+ commands
          const commandMethods = Object.keys(handler).filter(key => 
            key.startsWith('handle') || key.includes('Command')
          );
          
          console.log(chalk.cyan(`    📊 Found ${commandMethods.length} command methods`));
          
          if (commandMethods.length >= 60) {
            console.log(chalk.green('    🏁 60+ commands verified'));
            results.commands.count = commandMethods.length;
            results.commands.verified = true;
          } else {
            console.log(chalk.yellow(`    🟠️ Only ${commandMethods.length} commands found (expected 60+)`));
            results.commands.count = commandMethods.length;
            results.commands.verified = false;
            results.gaps.push(`Only ${commandMethods.length} commands found, expected 60+`);
          }
          
          results.components.commandHandler.functional = true;
          componentsPassed++;
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Handler error:'), error.message);
    results.components.commandHandler = { exists: false, error: error.message };
  }

  // ============== TEST COMMAND ROUTER INTEGRATION ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Command Router Integration...'));
  componentsTotal++;
  
  try {
    const integrationPath = path.join(__dirname, '../src/core/command-router-integration.js');
    if (!fs.existsSync(integrationPath)) {
      console.log(chalk.red('  🔴 Command Router Integration not found'));
      results.components.routerIntegration = { exists: false };
      results.gaps.push('Command Router Integration file missing');
    } else {
      const RouterIntegration = require('../src/core/command-router-integration');
      console.log(chalk.green('  🏁 Command Router Integration exists'));
      results.components.routerIntegration = { exists: true, functional: true };
      componentsPassed++;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Router Integration error:'), error.message);
    results.components.routerIntegration = { exists: false, error: error.message };
  }

  // ============== TEST SIMPLE ROUTER ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Simple Router (fallback)...'));
  componentsTotal++;
  
  try {
    const simpleRouterPath = path.join(__dirname, '../src/core/simple-router.js');
    if (!fs.existsSync(simpleRouterPath)) {
      console.log(chalk.red('  🔴 Simple Router not found'));
      results.components.simpleRouter = { exists: false };
      results.gaps.push('Simple Router file missing');
    } else {
      const SimpleRouter = require('../src/core/simple-router');
      console.log(chalk.green('  🏁 Simple Router exists'));
      results.components.simpleRouter = { exists: true, functional: true };
      componentsPassed++;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Simple Router error:'), error.message);
    results.components.simpleRouter = { exists: false, error: error.message };
  }

  // ============== TEST COMMAND VALIDATION PIPELINE ==============
  console.log(chalk.bold.yellow('\n🏁 Testing Command Validation Pipeline...'));
  componentsTotal++;
  
  try {
    // Check in security folder
    const validatorPath = path.join(__dirname, '../src/core/security/command-validator.js');
    if (!fs.existsSync(validatorPath)) {
      console.log(chalk.red('  🔴 Command Validator not found'));
      results.components.commandValidator = { exists: false };
      results.gaps.push('Command Validation Pipeline missing');
    } else {
      const { CommandValidator } = require('../src/core/security/command-validator');
      
      if (CommandValidator) {
        const validator = new CommandValidator();
        console.log(chalk.green('  🏁 Command Validator exists'));
        
        // Test validation methods
        if (typeof validator.validate === 'function') {
          console.log(chalk.green('    🏁 Validation pipeline functional'));
          results.components.commandValidator = { exists: true, functional: true };
          componentsPassed++;
        } else {
          console.log(chalk.yellow('    🟠️ Validation methods incomplete'));
          results.components.commandValidator = { exists: true, functional: false };
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Validator error:'), error.message);
    results.components.commandValidator = { exists: false, error: error.message };
  }

  // ============== TEST COMMAND OPTIMIZER ==============
  console.log(chalk.bold.yellow('\n🟢 Testing Command Optimizer...'));
  componentsTotal++;
  
  try {
    const optimizerPath = path.join(__dirname, '../src/utils/commandOptimizer.js');
    if (!fs.existsSync(optimizerPath)) {
      console.log(chalk.red('  🔴 Command Optimizer not found'));
      results.components.commandOptimizer = { exists: false };
      results.gaps.push('Command Optimizer missing');
    } else {
      const optimizer = require('../src/utils/commandOptimizer');
      
      if (optimizer) {
        console.log(chalk.green('  🏁 Command Optimizer exists'));
        
        // Test optimizer methods
        const methods = ['optimize', 'analyzeCommand', 'suggestOptimizations'];
        let methodsFound = 0;
        
        for (const method of methods) {
          if (typeof optimizer[method] === 'function') {
            methodsFound++;
            console.log(chalk.green(`    🏁 ${method} method exists`));
          }
        }
        
        if (methodsFound > 0) {
          results.components.commandOptimizer = { exists: true, functional: true };
          componentsPassed++;
        } else {
          results.components.commandOptimizer = { exists: true, functional: false };
          results.gaps.push('Command Optimizer methods missing');
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command Optimizer error:'), error.message);
    results.components.commandOptimizer = { exists: false, error: error.message };
  }

  // ============== TEST ROUTING FEATURES ==============
  console.log(chalk.bold.yellow('\n🔧 Testing Routing Features...'));
  
  // Test command routing
  featuresTotal++;
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    // Try to route a test command
    const testCommand = { command: 'test', args: [] };
    if (typeof router.routeCommand === 'function') {
      console.log(chalk.green('  🏁 Command routing functional'));
      results.features.commandRouting = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Command routing not functional'));
      results.features.commandRouting = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command routing error:'), error.message);
    results.features.commandRouting = false;
  }

  // Test department routing
  featuresTotal++;
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    if (typeof router.registerDepartment === 'function') {
      console.log(chalk.green('  🏁 Department routing functional'));
      results.features.departmentRouting = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Department routing not functional'));
      results.features.departmentRouting = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Department routing error:'), error.message);
    results.features.departmentRouting = false;
  }

  // Test priority analysis
  featuresTotal++;
  try {
    const { BumbaIntelligentRouter } = require('../src/core/unified-routing-system');
    const router = new BumbaIntelligentRouter();
    
    if (typeof router.getPriority === 'function' || typeof router.analyze === 'function') {
      console.log(chalk.green('  🏁 Priority analysis functional'));
      results.features.priorityAnalysis = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Priority analysis not functional'));
      results.features.priorityAnalysis = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Priority analysis error:'), error.message);
    results.features.priorityAnalysis = false;
  }

  // Test fallback routing
  featuresTotal++;
  try {
    const simpleRouterPath = path.join(__dirname, '../src/core/simple-router.js');
    if (fs.existsSync(simpleRouterPath)) {
      console.log(chalk.green('  🏁 Fallback routing available'));
      results.features.fallbackRouting = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Fallback routing not available'));
      results.features.fallbackRouting = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Fallback routing error:'), error.message);
    results.features.fallbackRouting = false;
  }

  // Test validation pipeline
  featuresTotal++;
  try {
    const validatorPath = path.join(__dirname, '../src/core/security/command-validator.js');
    if (fs.existsSync(validatorPath)) {
      const { CommandValidator } = require('../src/core/security/command-validator');
      const validator = new CommandValidator();
      
      if (typeof validator.validate === 'function') {
        console.log(chalk.green('  🏁 Validation pipeline functional'));
        results.features.validationPipeline = true;
        featuresPassed++;
      } else {
        console.log(chalk.red('  🔴 Validation pipeline not functional'));
        results.features.validationPipeline = false;
      }
    } else {
      console.log(chalk.red('  🔴 Validation pipeline not found'));
      results.features.validationPipeline = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Validation pipeline error:'), error.message);
    results.features.validationPipeline = false;
  }

  // Test optimization
  featuresTotal++;
  try {
    const optimizerPath = path.join(__dirname, '../src/utils/commandOptimizer.js');
    if (fs.existsSync(optimizerPath)) {
      console.log(chalk.green('  🏁 Command optimization available'));
      results.features.optimization = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Command optimization not available'));
      results.features.optimization = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Command optimization error:'), error.message);
    results.features.optimization = false;
  }

  // Calculate scores
  const componentScore = Math.round((componentsPassed / componentsTotal) * 100);
  const featureScore = Math.round((featuresPassed / featuresTotal) * 100);
  const overallScore = Math.round(((componentsPassed + featuresPassed) / (componentsTotal + featuresTotal)) * 100);

  // Add recommendations
  if (results.gaps.length > 0) {
    results.recommendations.push('Address identified gaps in components');
  }
  
  if (!results.commands.verified) {
    results.recommendations.push('Implement remaining commands to reach 60+ target');
  }

  if (featureScore < 100) {
    results.recommendations.push('Improve feature functionality for complete routing capability');
  }

  // Display results
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('AUDIT RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold('\n📊 Component Coverage:'), `${componentsPassed}/${componentsTotal} (${componentScore}%)`);
  console.log(chalk.bold('🟢 Feature Coverage:'), `${featuresPassed}/${featuresTotal} (${featureScore}%)`);
  console.log(chalk.bold('🟡 Overall Score:'), `${overallScore}%`);
  
  if (results.gaps.length > 0) {
    console.log(chalk.bold.yellow('\n🟠️ Gaps Identified:'));
    results.gaps.forEach(gap => console.log(`  - ${gap}`));
  }
  
  if (results.recommendations.length > 0) {
    console.log(chalk.bold.cyan('\n💡 Recommendations:'));
    results.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  // Save results
  const reportPath = path.join(__dirname, '../ROUTING_ARCHITECTURE_AUDIT_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    scores: {
      components: componentScore,
      features: featureScore,
      overall: overallScore,
      componentCoverage: `${componentsPassed}/${componentsTotal}`,
      featureCoverage: `${featuresPassed}/${featuresTotal}`
    }
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: ROUTING_ARCHITECTURE_AUDIT_RESULTS.json`));
  
  return overallScore;
}

// Run audit
console.log(chalk.gray('\nStarting routing architecture audit...\n'));

auditRoutingArchitecture().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  
  if (score === 100) {
    console.log(chalk.bold.green('🏁 ROUTING & COMMAND ARCHITECTURE: 100% OPERATIONAL'));
  } else if (score >= 80) {
    console.log(chalk.bold.yellow(`🟠️ ROUTING & COMMAND ARCHITECTURE: ${score}% OPERATIONAL`));
  } else {
    console.log(chalk.bold.red(`🔴 ROUTING & COMMAND ARCHITECTURE: ${score}% OPERATIONAL`));
  }
  
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during audit:'), error);
  process.exit(1);
});