#!/usr/bin/env node

/**
 * Pre-publish Validation Script
 * Ensures the package is ready for NPM publication
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.cyan.bold('\n🔍 Running Pre-Publish Checks for BUMBA Framework\n'));

const errors = [];
const warnings = [];

// Check 1: Package.json validity
function checkPackageJson() {
  console.log(chalk.blue('Checking package.json...'));
  
  try {
    const pkg = require('../package.json');
    
    // Required fields
    const required = ['name', 'version', 'description', 'main', 'author', 'license'];
    for (const field of required) {
      if (!pkg[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Version format
    if (pkg.version && !/^\d+\.\d+\.\d+/.test(pkg.version)) {
      errors.push(`Invalid version format: ${pkg.version}`);
    }
    
    // Check if name is available
    if (pkg.name && pkg.name.includes('/')) {
      warnings.push('Package name contains "/" - might be a scoped package');
    }
    
    console.log(chalk.green('  ✓ package.json is valid'));
  } catch (error) {
    errors.push(`Failed to read package.json: ${error.message}`);
  }
}

// Check 2: Entry points exist
function checkEntryPoints() {
  console.log(chalk.blue('Checking entry points...'));
  
  const pkg = require('../package.json');
  
  // Main entry
  if (pkg.main) {
    const mainPath = path.join(__dirname, '..', pkg.main);
    if (!fs.existsSync(mainPath)) {
      errors.push(`Main entry point not found: ${pkg.main}`);
    } else {
      console.log(chalk.green(`  ✓ Main entry: ${pkg.main}`));
    }
  }
  
  // Bin entries
  if (pkg.bin) {
    for (const [name, binPath] of Object.entries(pkg.bin)) {
      const fullPath = path.join(__dirname, '..', binPath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Bin entry not found: ${name} -> ${binPath}`);
      } else {
        console.log(chalk.green(`  ✓ Bin entry: ${name}`));
      }
    }
  }
  
  // Exports
  if (pkg.exports) {
    for (const [exportName, exportPath] of Object.entries(pkg.exports)) {
      if (typeof exportPath === 'string') {
        const fullPath = path.join(__dirname, '..', exportPath);
        if (!fs.existsSync(fullPath)) {
          warnings.push(`Export not found: ${exportName} -> ${exportPath}`);
        }
      }
    }
  }
}

// Check 3: Required files exist
function checkRequiredFiles() {
  console.log(chalk.blue('Checking required files...'));
  
  const requiredFiles = [
    'README.md',
    'LICENSE',
    'package.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Required file missing: ${file}`);
    } else {
      console.log(chalk.green(`  ✓ ${file}`));
    }
  }
}

// Check 4: Security files not included
function checkSecurityExclusions() {
  console.log(chalk.blue('Checking security exclusions...'));
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    'security-audit/',
    '*.pem',
    '*.key',
    '*.cert'
  ];
  
  let secure = true;
  for (const pattern of sensitiveFiles) {
    const filePath = path.join(__dirname, '..', pattern);
    if (fs.existsSync(filePath)) {
      warnings.push(`Sensitive file exists, ensure it's in .npmignore: ${pattern}`);
      secure = false;
    }
  }
  
  if (secure) {
    console.log(chalk.green('  ✓ No sensitive files detected'));
  }
}

// Check 5: Dependencies
function checkDependencies() {
  console.log(chalk.blue('Checking dependencies...'));
  
  const pkg = require('../package.json');
  
  if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
    warnings.push('No dependencies defined');
  } else {
    console.log(chalk.green(`  ✓ ${Object.keys(pkg.dependencies).length} dependencies`));
  }
  
  if (pkg.devDependencies) {
    console.log(chalk.green(`  ✓ ${Object.keys(pkg.devDependencies).length} dev dependencies`));
  }
}

// Check 6: Node version requirement
function checkNodeVersion() {
  console.log(chalk.blue('Checking Node version requirement...'));
  
  const pkg = require('../package.json');
  
  if (!pkg.engines || !pkg.engines.node) {
    warnings.push('No Node.js version requirement specified');
  } else {
    console.log(chalk.green(`  ✓ Requires Node ${pkg.engines.node}`));
  }
}

// Check 7: Package size
function checkPackageSize() {
  console.log(chalk.blue('Checking package size...'));
  
  // This is a rough estimate
  const maxSizeMB = 50;
  const srcPath = path.join(__dirname, '..', 'src');
  
  let totalSize = 0;
  function getDirectorySize(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getDirectorySize(fullPath);
      } else {
        totalSize += stat.size;
      }
    }
  }
  
  try {
    getDirectorySize(srcPath);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    if (sizeMB > maxSizeMB) {
      warnings.push(`Package size is large: ${sizeMB}MB (max recommended: ${maxSizeMB}MB)`);
    } else {
      console.log(chalk.green(`  ✓ Package size: ~${sizeMB}MB`));
    }
  } catch (error) {
    warnings.push(`Could not calculate package size: ${error.message}`);
  }
}

// Check 8: README content
function checkReadme() {
  console.log(chalk.blue('Checking README...'));
  
  const readmePath = path.join(__dirname, '..', 'README.md');
  
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    
    // Check for minimum sections
    const requiredSections = ['Installation', 'Usage', 'Features'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        warnings.push(`README might be missing section: ${section}`);
      }
    }
    
    if (content.length < 500) {
      warnings.push('README seems too short (< 500 characters)');
    } else {
      console.log(chalk.green(`  ✓ README has ${content.length} characters`));
    }
  }
}

// Check 9: .npmignore exists
function checkNpmIgnore() {
  console.log(chalk.blue('Checking .npmignore...'));
  
  const npmignorePath = path.join(__dirname, '..', '.npmignore');
  
  if (!fs.existsSync(npmignorePath)) {
    warnings.push('.npmignore file not found - all files will be published');
  } else {
    const content = fs.readFileSync(npmignorePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    console.log(chalk.green(`  ✓ .npmignore has ${lines.length} exclusion patterns`));
  }
}

// Run all checks
function runAllChecks() {
  checkPackageJson();
  checkEntryPoints();
  checkRequiredFiles();
  checkSecurityExclusions();
  checkDependencies();
  checkNodeVersion();
  checkPackageSize();
  checkReadme();
  checkNpmIgnore();
  
  // Summary
  console.log(chalk.cyan.bold('\n📋 Pre-Publish Check Summary:\n'));
  
  if (errors.length > 0) {
    console.log(chalk.red.bold('❌ ERRORS (must fix before publishing):'));
    errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  WARNINGS (consider fixing):'));
    warnings.forEach(warn => console.log(chalk.yellow(`  - ${warn}`)));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green.bold('✅ All checks passed! Package is ready for publication.'));
  } else if (errors.length === 0) {
    console.log(chalk.green.bold('\n✅ No critical errors. Package can be published with warnings.'));
  } else {
    console.log(chalk.red.bold('\n❌ Please fix errors before publishing.'));
    process.exit(1);
  }
  
  // Final advice
  console.log(chalk.cyan.bold('\n📦 Next Steps:'));
  console.log(chalk.cyan('  1. Review and fix any issues above'));
  console.log(chalk.cyan('  2. Run: npm run test'));
  console.log(chalk.cyan('  3. Run: node scripts/npm-publish.js'));
  console.log(chalk.cyan('  4. Or use: npm publish'));
  console.log();
}

// Execute
runAllChecks();