#!/usr/bin/env node

/**
 * BUMBA CLI Setup Validation Script
 * Validates environment, dependencies, and configuration
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class SetupValidator {
  constructor() {
    this.checks = [];
    this.failures = [];
    this.warnings = [];
  }

  // Check if file exists
  checkFile(filepath, description, required = true) {
    const exists = fs.existsSync(filepath);
    const status = exists ? '🏁' : (required ? '🔴' : '🟠️');
    
    this.checks.push({
      name: description,
      path: filepath,
      status,
      exists
    });

    if (!exists && required) {
      this.failures.push(`Missing required file: ${filepath}`);
    } else if (!exists) {
      this.warnings.push(`Optional file missing: ${filepath}`);
    }

    return exists;
  }

  // Check Node.js version
  checkNodeVersion() {
    const requiredVersion = '18.0.0';
    const currentVersion = process.version.substring(1);
    const valid = this.compareVersions(currentVersion, requiredVersion) >= 0;
    
    this.checks.push({
      name: 'Node.js Version',
      current: currentVersion,
      required: requiredVersion,
      status: valid ? '🏁' : '🔴',
      valid
    });

    if (!valid) {
      this.failures.push(`Node.js version ${requiredVersion} or higher required (current: ${currentVersion})`);
    }

    return valid;
  }

  // Compare version strings
  compareVersions(a, b) {
    const pa = a.split('.');
    const pb = b.split('.');
    
    for (let i = 0; i < 3; i++) {
      const na = Number(pa[i]);
      const nb = Number(pb[i]);
      if (na > nb) return 1;
      if (nb > na) return -1;
      if (!isNaN(na) && isNaN(nb)) return 1;
      if (isNaN(na) && !isNaN(nb)) return -1;
    }
    
    return 0;
  }

  // Check environment variables
  checkEnvironment() {
    const envPath = path.join(process.cwd(), '.env');
    const exists = fs.existsSync(envPath);
    
    if (exists) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const hasApiKeys = content.includes('API_KEY');
      
      this.checks.push({
        name: 'Environment Configuration',
        status: hasApiKeys ? '🏁' : '🟠️',
        exists: true,
        configured: hasApiKeys
      });

      if (!hasApiKeys) {
        this.warnings.push('No API keys configured in .env file');
      }
    } else {
      this.checks.push({
        name: 'Environment Configuration',
        status: '🔴',
        exists: false
      });
      this.failures.push('Missing .env file');
    }

    return exists;
  }

  // Check dependencies
  checkDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    const packageExists = fs.existsSync(packagePath);
    const modulesExist = fs.existsSync(nodeModulesPath);
    
    this.checks.push({
      name: 'Dependencies',
      status: (packageExists && modulesExist) ? '🏁' : '🔴',
      packageJson: packageExists,
      nodeModules: modulesExist
    });

    if (!packageExists) {
      this.failures.push('Missing package.json');
    }
    if (!modulesExist) {
      this.failures.push('Dependencies not installed (run: npm install)');
    }

    return packageExists && modulesExist;
  }

  // Run all validations
  async validate() {
    console.log(chalk.bold.blue('\n🔍 BUMBA CLI Setup Validation\n'));
    console.log(chalk.gray('─'.repeat(50)));

    // Core files
    console.log(chalk.bold('\n📁 Core Files:'));
    this.checkFile('src/index.js', 'Main entry point');
    this.checkFile('bumba.config.js', 'Configuration file');
    this.checkFile('.env', 'Environment file');
    this.checkFile('package.json', 'Package configuration');

    // Framework components
    console.log(chalk.bold('\n🟢️ Framework Components:'));
    this.checkFile('src/core/bumba-framework-2.js', 'Core framework');
    this.checkFile('src/core/command-handler.js', 'Command handler');
    this.checkFile('src/core/unified-routing-system.js', 'Routing system');
    
    // Departments
    console.log(chalk.bold('\n👥 Department Managers:'));
    this.checkFile('src/core/departments/product-strategist-manager.js', 'Product Manager');
    this.checkFile('src/core/departments/design-engineer-manager.js', 'Design Manager');
    this.checkFile('src/core/departments/backend-engineer-manager.js', 'Backend Manager');

    // Critical systems
    console.log(chalk.bold('\n🟢️ Critical Systems:'));
    this.checkFile('src/core/error-handling/bumba-error-system.js', 'Error handling');
    this.checkFile('src/core/security/command-validator.js', 'Security validation');
    this.checkFile('src/core/logging/bumba-logger.js', 'Logging system');

    // Assets
    console.log(chalk.bold('\n🔴 Assets:'));
    this.checkFile('assets/audio/bumba-horn.mp3', 'Audio feedback', false);

    // Environment checks
    console.log(chalk.bold('\n🟢 Environment:'));
    this.checkNodeVersion();
    this.checkEnvironment();
    this.checkDependencies();

    // Summary
    console.log(chalk.gray('\n' + '─'.repeat(50)));
    console.log(chalk.bold('\n📊 Validation Summary:\n'));
    
    const totalChecks = this.checks.length;
    const passed = this.checks.filter(c => c.status === '🏁').length;
    const failed = this.checks.filter(c => c.status === '🔴').length;
    const warnings = this.checks.filter(c => c.status === '🟠️').length;

    console.log(`  ${chalk.green('🏁 Passed:')} ${passed}/${totalChecks}`);
    console.log(`  ${chalk.red('🔴 Failed:')} ${failed}/${totalChecks}`);
    console.log(`  ${chalk.yellow('🟠️ Warnings:')} ${warnings}/${totalChecks}`);

    if (this.failures.length > 0) {
      console.log(chalk.red.bold('\n🔴 Critical Issues:'));
      this.failures.forEach(f => console.log(`  - ${f}`));
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold('\n🟠️ Warnings:'));
      this.warnings.forEach(w => console.log(`  - ${w}`));
    }

    const success = this.failures.length === 0;
    
    if (success) {
      console.log(chalk.green.bold('\n🏁 Setup validation passed!'));
      console.log(chalk.gray('Framework is ready to initialize.\n'));
    } else {
      console.log(chalk.red.bold('\n🔴 Setup validation failed!'));
      console.log(chalk.gray('Please fix the issues above before proceeding.\n'));
    }

    return {
      success,
      checks: this.checks,
      failures: this.failures,
      warnings: this.warnings,
      stats: {
        total: totalChecks,
        passed,
        failed,
        warnings
      }
    };
  }
}

// Run validation if executed directly
if (require.main === module) {
  const validator = new SetupValidator();
  validator.validate().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = SetupValidator;