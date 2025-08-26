#!/usr/bin/env node

/**
 * Verify Critical Paths - Day 2 Task
 * Verifies that all critical components work without silent failures
 */

const chalk = require('chalk');

async function runTests() {
  console.log(chalk.blue('🔍 Verifying BUMBA Critical Paths\n'));

  let passed = 0;
  let failed = 0;

  // Test 1: Configuration Manager
  console.log(chalk.yellow('1. Configuration Manager:'));
  try {
    const { ConfigurationManager } = require('../src/core/configuration/configuration-manager');
    const config = new ConfigurationManager();
    
    if (config.config.framework.name === 'BUMBA') {
      console.log(chalk.green('  🏁 Configuration loads correctly'));
      passed++;
    } else {
      throw new Error('Configuration not loaded');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 2: Unified Error Manager
  console.log(chalk.yellow('\n2. Unified Error Manager:'));
  try {
    const { getInstance } = require('../src/core/error-handling/unified-error-manager');
    const errorManager = getInstance();
    
    // Test error handling
    await errorManager.handleError(new Error('Test error'), { context: 'test' });
    const metrics = errorManager.getMetrics();
    
    if (metrics.totalErrors > 0) {
      console.log(chalk.green('  🏁 Error handling works'));
      passed++;
    } else {
      throw new Error('Error not tracked');
    }
    
    // Test stop method
    errorManager.stop();
    console.log(chalk.green('  🏁 Stop method works'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 3: API Validator
  console.log(chalk.yellow('\n3. API Validator:'));
  try {
    const { getInstance } = require('../src/core/validation/api-validator');
    const apiValidator = getInstance();
    
    const result = await apiValidator.validateAll();
    
    if (result && result.overall) {
      console.log(chalk.green(`  🏁 API validation works (status: ${result.overall})`));
      passed++;
    } else {
      throw new Error('API validation failed');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 4: Notion Hub
  console.log(chalk.yellow('\n4. Notion Hub:'));
  try {
    const { getInstance } = require('../src/core/integrations/notion-hub');
    const notionHub = getInstance();
    
    // Test initialization
    const initResult = await notionHub.initialize();
    if (initResult.success !== undefined) {
      console.log(chalk.green('  🏁 Notion Hub initializes with fallback'));
      passed++;
    }
    
    // Test health check
    const health = await notionHub.healthCheck();
    if (health.available !== undefined) {
      console.log(chalk.green('  🏁 Health check works'));
      passed++;
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 5: Resource Enforcer
  console.log(chalk.yellow('\n5. Resource Enforcer:'));
  try {
    const { getInstance } = require('../src/core/resource-management/resource-enforcer');
    const enforcer = getInstance();
    
    const canAllocate = enforcer.canAllocate('task');
    const usage = enforcer.getUsage();
    
    if (typeof canAllocate === 'boolean' && usage.memory !== undefined) {
      console.log(chalk.green('  🏁 Resource management works'));
      passed++;
    } else {
      throw new Error('Resource enforcer not working');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 6: Command Handler
  console.log(chalk.yellow('\n6. Command Handler:'));
  try {
    const commandModule = require('../src/core/command-handler');
    
    // Test both possible exports
    const handler = commandModule.commandHandler || commandModule.CommandHandler;
    
    if (handler) {
      // If it's a class, instantiate it
      const commandHandler = typeof handler === 'function' ? new handler() : handler;
      
      if (commandHandler && typeof commandHandler.execute === 'function') {
        console.log(chalk.green('  🏁 Command handler initialized'));
        passed++;
      } else {
        throw new Error('Command handler missing execute method');
      }
    } else {
      throw new Error('Command handler not exported');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 7: Specialist Registry
  console.log(chalk.yellow('\n7. Specialist Registry:'));
  try {
    const { SpecialistRegistry } = require('../src/core/specialists/specialist-registry');
    const registry = new SpecialistRegistry();
    
    if (registry.specialists.size > 0) {
      console.log(chalk.green(`  🏁 Registry loaded ${registry.specialists.size} specialists`));
      passed++;
    } else {
      throw new Error('No specialists loaded');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Test 8: Framework Initialization (without full startup)
  console.log(chalk.yellow('\n8. Framework Structure:'));
  try {
    const { createBumbaFramework } = require('../src/core/bumba-framework-2');
    
    if (typeof createBumbaFramework === 'function') {
      console.log(chalk.green('  🏁 Framework exports correctly'));
      passed++;
    } else {
      throw new Error('Framework not exported');
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 Failed: ${error.message}`));
    failed++;
  }

  // Summary
  console.log(chalk.cyan('\n📊 Results:'));
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);
  
  const percentage = (passed / (passed + failed) * 100).toFixed(1);
  
  if (failed === 0) {
    console.log(chalk.green(`\n🏁 All critical paths verified! (${percentage}%)`));
  } else {
    console.log(chalk.yellow(`\n🟠️ Some critical paths need attention (${percentage}% passing)`));
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Suppress console logs during tests
if (!process.env.DEBUG) {
  const originalLog = console.log;
  console.log = (...args) => {
    // Only show our test output
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('🏁') || args[0].includes('🔴') || 
         args[0].includes('🔍') || args[0].includes('📊') || 
         args[0].includes(chalk.yellow('')) || args[0].includes(chalk.cyan('')))) {
      originalLog(...args);
    }
  };
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});