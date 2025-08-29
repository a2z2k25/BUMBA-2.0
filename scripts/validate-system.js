#!/usr/bin/env node

/**
 * BUMBA System Validation Script
 * Validates that all components are properly integrated and functional
 */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;

class SystemValidator {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async validate() {
    console.log(chalk.blue.bold('\n🔍 BUMBA System Validation\n'));
    
    // Run all validation checks
    await this.validateCoreComponents();
    await this.validateDepartments();
    await this.validateSpecialists();
    await this.validateCommands();
    await this.validateModes();
    await this.validatePerformance();
    await this.validateErrorHandling();
    await this.validateFileStructure();
    await this.validateDependencies();
    
    // Display results
    this.displayResults();
    
    return this.results.failed.length === 0;
  }

  async validateCoreComponents() {
    console.log(chalk.yellow('Validating Core Components...'));
    
    const components = [
      'command-router',
      'specialist-selector',
      'intelligent-output-generator',
      'multi-agent-collaborator',
      'command-chain-executor',
      'cache-manager',
      'performance-monitor',
      'resource-optimizer',
      'query-optimizer',
      'memory-manager',
      'load-balancer'
    ];
    
    for (const component of components) {
      try {
        const module = require(`../src/core/command-intelligence/${component}`);
        const instance = module.getInstance();
        
        if (instance) {
          this.pass(`✓ ${component} initialized`);
        } else {
          this.fail(`✗ ${component} failed to initialize`);
        }
      } catch (error) {
        this.fail(`✗ ${component}: ${error.message}`);
      }
    }
  }

  async validateDepartments() {
    console.log(chalk.yellow('\nValidating Department Managers...'));
    
    const departments = ['product', 'design', 'backend'];
    
    for (const dept of departments) {
      try {
        const Manager = require(`../src/core/department-managers/${dept}-manager`);
        const instance = new Manager();
        
        // Test basic execution
        const testResult = await instance.canHandle('test-command');
        this.pass(`✓ ${dept} department operational`);
      } catch (error) {
        this.fail(`✗ ${dept} department: ${error.message}`);
      }
    }
  }

  async validateSpecialists() {
    console.log(chalk.yellow('\nValidating Specialist Registry...'));
    
    try {
      const registry = require('../src/core/specialists/specialist-registry');
      const specialists = registry.getAllSpecialists();
      
      if (specialists.length > 0) {
        this.pass(`✓ ${specialists.length} specialists registered`);
        
        // Validate each specialist has required properties
        let valid = 0;
        for (const specialist of specialists) {
          if (specialist.id && specialist.skills && specialist.department) {
            valid++;
          }
        }
        
        if (valid === specialists.length) {
          this.pass(`✓ All specialists properly configured`);
        } else {
          this.warn(`⚠ ${specialists.length - valid} specialists missing required properties`);
        }
      } else {
        this.fail('✗ No specialists registered');
      }
    } catch (error) {
      this.fail(`✗ Specialist registry: ${error.message}`);
    }
  }

  async validateCommands() {
    console.log(chalk.yellow('\nValidating Command Mappings...'));
    
    try {
      const commandMap = require('../src/core/config/command-department-map.json');
      const commands = Object.keys(commandMap);
      
      if (commands.length > 0) {
        this.pass(`✓ ${commands.length} commands mapped`);
        
        // Validate critical commands
        const criticalCommands = ['prd', 'api', 'design', 'implement', 'analyze'];
        for (const cmd of criticalCommands) {
          if (commands.includes(cmd)) {
            this.pass(`✓ Critical command '${cmd}' configured`);
          } else {
            this.fail(`✗ Critical command '${cmd}' missing`);
          }
        }
      } else {
        this.fail('✗ No commands mapped');
      }
    } catch (error) {
      this.fail(`✗ Command mappings: ${error.message}`);
    }
  }

  async validateModes() {
    console.log(chalk.yellow('\nValidating Execution Modes...'));
    
    const modes = ['full', 'lite', 'turbo', 'eco', 'DICE', 'executive'];
    
    try {
      const modeManager = require('../src/core/modes/execution-modes');
      
      for (const mode of modes) {
        const config = modeManager.getModeConfig(mode);
        if (config) {
          this.pass(`✓ Mode '${mode}' configured`);
        } else {
          this.warn(`⚠ Mode '${mode}' not configured`);
        }
      }
    } catch (error) {
      this.fail(`✗ Execution modes: ${error.message}`);
    }
  }

  async validatePerformance() {
    console.log(chalk.yellow('\nValidating Performance Systems...'));
    
    try {
      // Check cache manager
      const cache = require('../src/core/command-intelligence/cache-manager').getInstance();
      const cacheStats = cache.getStats();
      this.pass(`✓ Cache manager operational (${cacheStats.items} items)`);
      
      // Check performance monitor
      const monitor = require('../src/core/command-intelligence/performance-monitor').getInstance();
      const perfStats = monitor.getStats();
      this.pass(`✓ Performance monitor active`);
      
      // Check resource optimizer
      const optimizer = require('../src/core/command-intelligence/resource-optimizer').getInstance();
      const resourceStats = optimizer.getStats();
      this.pass(`✓ Resource optimizer running`);
      
      // Check memory manager
      const memory = require('../src/core/command-intelligence/memory-manager').getInstance();
      const memStats = memory.getStats();
      this.pass(`✓ Memory manager active (${memStats.current.percent} used)`);
      
    } catch (error) {
      this.fail(`✗ Performance systems: ${error.message}`);
    }
  }

  async validateErrorHandling() {
    console.log(chalk.yellow('\nValidating Error Handling...'));
    
    try {
      const errorManager = require('../src/core/error-handling/unified-error-manager').getInstance();
      
      // Test error classification
      const testError = new Error('Test error');
      const classification = errorManager.classifyError(testError);
      
      if (classification) {
        this.pass('✓ Error classification working');
      }
      
      // Check error dump directory
      const dumpDir = path.join(process.cwd(), '.bumba-errors');
      try {
        await fs.access(dumpDir);
        const files = await fs.readdir(dumpDir);
        if (files.length <= 10) {
          this.pass(`✓ Error dump management working (${files.length} files)`);
        } else {
          this.warn(`⚠ Error dump directory has ${files.length} files (max 10)`);
        }
      } catch {
        this.pass('✓ Error dump directory not created (no errors)');
      }
      
    } catch (error) {
      this.fail(`✗ Error handling: ${error.message}`);
    }
  }

  async validateFileStructure() {
    console.log(chalk.yellow('\nValidating File Structure...'));
    
    const requiredDirs = [
      'src/core/command-intelligence',
      'src/core/department-managers',
      'src/core/specialists',
      'src/core/error-handling',
      'src/core/modes',
      'docs',
      'output',
      'tests'
    ];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(process.cwd(), dir));
        this.pass(`✓ Directory exists: ${dir}`);
      } catch {
        this.fail(`✗ Missing directory: ${dir}`);
      }
    }
    
    // Check critical files
    const criticalFiles = [
      'package.json',
      'bumba.config.js',
      'README.md',
      '.gitignore'
    ];
    
    for (const file of criticalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        this.pass(`✓ File exists: ${file}`);
      } catch {
        this.fail(`✗ Missing file: ${file}`);
      }
    }
  }

  async validateDependencies() {
    console.log(chalk.yellow('\nValidating Dependencies...'));
    
    try {
      const packageJson = require('../package.json');
      const dependencies = Object.keys(packageJson.dependencies || {});
      
      this.pass(`✓ ${dependencies.length} dependencies configured`);
      
      // Check critical dependencies
      const critical = ['commander', 'chalk', 'inquirer'];
      for (const dep of critical) {
        if (dependencies.includes(dep)) {
          this.pass(`✓ Critical dependency '${dep}' present`);
        } else {
          this.warn(`⚠ Missing dependency '${dep}'`);
        }
      }
      
      // Check version
      if (packageJson.version) {
        this.pass(`✓ Version: ${packageJson.version}`);
      }
      
    } catch (error) {
      this.fail(`✗ Dependencies: ${error.message}`);
    }
  }

  pass(message) {
    console.log(chalk.green(message));
    this.results.passed.push(message);
  }

  fail(message) {
    console.log(chalk.red(message));
    this.results.failed.push(message);
  }

  warn(message) {
    console.log(chalk.yellow(message));
    this.results.warnings.push(message);
  }

  displayResults() {
    console.log(chalk.blue.bold('\n📊 Validation Results\n'));
    
    console.log(chalk.green(`✓ Passed: ${this.results.passed.length}`));
    console.log(chalk.yellow(`⚠ Warnings: ${this.results.warnings.length}`));
    console.log(chalk.red(`✗ Failed: ${this.results.failed.length}`));
    
    if (this.results.failed.length === 0) {
      console.log(chalk.green.bold('\n✨ System validation PASSED! All components operational.\n'));
    } else {
      console.log(chalk.red.bold('\n❌ System validation FAILED. Please fix the issues above.\n'));
      
      console.log(chalk.red('Failed checks:'));
      this.results.failed.forEach(f => console.log(chalk.red(`  - ${f}`)));
    }
    
    if (this.results.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings to address:'));
      this.results.warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)));
    }
  }
}

// Run validation
async function main() {
  const validator = new SystemValidator();
  const success = await validator.validate();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Validation error:'), error);
    process.exit(1);
  });
}

module.exports = SystemValidator;