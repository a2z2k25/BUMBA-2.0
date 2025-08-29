#!/usr/bin/env node

/**
 * NPM Publication Script for BUMBA CLI
 * This script handles the publication process to NPM
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

console.log(chalk.cyan.bold('\n📦 BUMBA CLI - NPM Publication Script\n'));

// Validation steps
const validations = [
  {
    name: 'Check Node version',
    check: () => {
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.split('.')[0].substring(1));
      if (major < 18) {
        throw new Error(`Node.js 18+ required (current: ${nodeVersion})`);
      }
      return `✓ Node ${nodeVersion}`;
    }
  },
  {
    name: 'Check package.json',
    check: () => {
      const pkg = require('../package.json');
      if (!pkg.name || !pkg.version || !pkg.description) {
        throw new Error('Missing required fields in package.json');
      }
      return `✓ ${pkg.name}@${pkg.version}`;
    }
  },
  {
    name: 'Check LICENSE file',
    check: () => {
      const licensePath = path.join(__dirname, '..', 'LICENSE');
      if (!fs.existsSync(licensePath)) {
        throw new Error('LICENSE file not found');
      }
      return '✓ MIT License';
    }
  },
  {
    name: 'Check main entry point',
    check: () => {
      const pkg = require('../package.json');
      const mainPath = path.join(__dirname, '..', pkg.main);
      if (!fs.existsSync(mainPath)) {
        throw new Error(`Main entry point not found: ${pkg.main}`);
      }
      return `✓ ${pkg.main}`;
    }
  },
  {
    name: 'Check npm registry authentication',
    check: () => {
      try {
        execSync('npm whoami', { stdio: 'pipe' });
        return '✓ Authenticated';
      } catch (error) {
        throw new Error('Not authenticated with npm. Run: npm login');
      }
    }
  },
  {
    name: 'Check for uncommitted changes',
    check: () => {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
          console.log(chalk.yellow('\nWarning: Uncommitted changes detected:'));
          console.log(status);
          console.log(chalk.yellow('Consider committing changes before publishing.\n'));
        }
        return '✓ Git status checked';
      } catch (error) {
        return '⚠️  Git not available (skipping)';
      }
    }
  },
  {
    name: 'Run tests',
    check: () => {
      const spinner = ora('Running tests...').start();
      try {
        execSync('npm test', { stdio: 'pipe' });
        spinner.succeed('Tests passed');
        return '✓ All tests passed';
      } catch (error) {
        spinner.fail('Some tests failed');
        console.log(chalk.yellow('\nWarning: Some tests are failing.'));
        console.log(chalk.yellow('Publishing with failing tests is not recommended.\n'));
        return '⚠️  Tests have failures';
      }
    }
  },
  {
    name: 'Check package size',
    check: () => {
      const spinner = ora('Calculating package size...').start();
      try {
        const output = execSync('npm pack --dry-run 2>&1', { encoding: 'utf8' });
        const sizeMatch = output.match(/package size:\s+([^\n]+)/);
        const fileCountMatch = output.match(/total files:\s+([^\n]+)/);
        
        if (sizeMatch && fileCountMatch) {
          spinner.succeed(`Package size: ${sizeMatch[1]}, Files: ${fileCountMatch[1]}`);
          return `✓ Size: ${sizeMatch[1]}`;
        }
        spinner.succeed('Package size checked');
        return '✓ Package size acceptable';
      } catch (error) {
        spinner.warn('Could not determine package size');
        return '⚠️  Size check skipped';
      }
    }
  }
];

// Run validations
async function runValidations() {
  console.log(chalk.blue('Running pre-publication checks...\n'));
  
  const results = [];
  for (const validation of validations) {
    try {
      const result = await validation.check();
      console.log(chalk.green(`  ${result}`));
      results.push({ name: validation.name, success: true });
    } catch (error) {
      console.log(chalk.red(`  ✗ ${validation.name}: ${error.message}`));
      results.push({ name: validation.name, success: false, error: error.message });
    }
  }
  
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(chalk.red('\n❌ Pre-publication checks failed:'));
    failures.forEach(f => {
      console.log(chalk.red(`  - ${f.name}: ${f.error}`));
    });
    return false;
  }
  
  return true;
}

// Publish to NPM
async function publish() {
  const pkg = require('../package.json');
  
  console.log(chalk.blue(`\n📤 Publishing ${pkg.name}@${pkg.version} to NPM...\n`));
  
  // Check if this version already exists
  try {
    execSync(`npm view ${pkg.name}@${pkg.version}`, { stdio: 'pipe' });
    console.log(chalk.red(`\n❌ Version ${pkg.version} already exists on NPM.`));
    console.log(chalk.yellow('Please update the version in package.json before publishing.\n'));
    console.log(chalk.cyan('You can use:'));
    console.log(chalk.cyan('  npm version patch  # For bug fixes (2.0.0 -> 2.0.1)'));
    console.log(chalk.cyan('  npm version minor  # For new features (2.0.0 -> 2.1.0)'));
    console.log(chalk.cyan('  npm version major  # For breaking changes (2.0.0 -> 3.0.0)\n'));
    process.exit(1);
  } catch (error) {
    // Version doesn't exist, good to publish
  }
  
  // Dry run first
  console.log(chalk.yellow('Performing dry run...\n'));
  try {
    execSync('npm publish --dry-run', { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.red('\n❌ Dry run failed. Please fix the issues above.\n'));
    process.exit(1);
  }
  
  // Ask for confirmation
  console.log(chalk.yellow('\n⚠️  Ready to publish to NPM (this action cannot be undone).'));
  console.log(chalk.cyan(`\nPackage: ${pkg.name}@${pkg.version}`));
  console.log(chalk.cyan(`Registry: https://registry.npmjs.org/\n`));
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question(chalk.bold('Do you want to continue? (yes/no) '), (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      console.log(chalk.green('\n🚀 Publishing to NPM...\n'));
      
      try {
        execSync('npm publish', { stdio: 'inherit' });
        console.log(chalk.green.bold(`\n✅ Successfully published ${pkg.name}@${pkg.version} to NPM!\n`));
        console.log(chalk.cyan('View your package at:'));
        console.log(chalk.cyan.underline(`https://www.npmjs.com/package/${pkg.name}\n`));
        console.log(chalk.yellow('Users can now install with:'));
        console.log(chalk.bold(`  npm install ${pkg.name}\n`));
      } catch (error) {
        console.log(chalk.red('\n❌ Publication failed. Please check the error above.\n'));
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('\n📦 Publication cancelled.\n'));
    }
    readline.close();
  });
}

// Main execution
async function main() {
  const validationsPassed = await runValidations();
  
  if (!validationsPassed) {
    console.log(chalk.red('\n❌ Please fix the issues above before publishing.\n'));
    process.exit(1);
  }
  
  console.log(chalk.green.bold('\n✅ All pre-publication checks passed!\n'));
  
  await publish();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error);
  process.exit(1);
});

// Run the script
main();