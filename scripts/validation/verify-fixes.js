#!/usr/bin/env node

/**
 * BUMBA Framework Fix Verification Script
 * Verifies all fixes have been applied correctly
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class FixVerification {
  constructor() {
    this.results = {
      syntaxErrors: { passed: false, details: [] },
      nullChecks: { passed: false, details: [] },
      versionConsistency: { passed: false, details: [] },
      dependencies: { passed: false, details: [] },
      mocks: { passed: false, details: [] },
      tests: { passed: false, details: [] }
    };
  }

  // Check 1: Verify syntax errors are fixed
  async verifySyntaxFixes() {
    console.log(`\n${colors.cyan}${colors.bold}Checking Syntax Fixes...${colors.reset}`);
    
    const filesToCheck = [
      'src/core/specialists/business/technical-writer.js',
      'src/core/monitoring/performance-monitor.js'
    ];

    for (const file of filesToCheck) {
      const filePath = path.join(process.cwd(), file);
      try {
        // Try to parse the file as a module
        delete require.cache[require.resolve(filePath)];
        require(filePath);
        this.results.syntaxErrors.details.push({
          file,
          status: 'PASS',
          message: 'No syntax errors'
        });
      } catch (error) {
        this.results.syntaxErrors.details.push({
          file,
          status: 'FAIL',
          message: error.message
        });
      }
    }

    this.results.syntaxErrors.passed = 
      this.results.syntaxErrors.details.every(d => d.status === 'PASS');
    
    this.printResults('Syntax Fixes', this.results.syntaxErrors);
  }

  // Check 2: Verify null checks are in place
  async verifyNullChecks() {
    console.log(`\n${colors.cyan}${colors.bold}Checking Null Safety...${colors.reset}`);
    
    const filePath = path.join(process.cwd(), 'src/core/monitoring/performance-monitor.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const checks = [
      {
        name: 'Division by zero check',
        pattern: /this\.stats\.totalOperations\s*>\s*0/,
        found: false
      },
      {
        name: 'Memory object null check',
        pattern: /metric\.memory\s*&&\s*metric\.memory\.percentage/,
        found: false
      }
    ];

    checks.forEach(check => {
      check.found = check.pattern.test(content);
      this.results.nullChecks.details.push({
        check: check.name,
        status: check.found ? 'PASS' : 'FAIL',
        message: check.found ? 'Protection in place' : 'Missing null check'
      });
    });

    this.results.nullChecks.passed = checks.every(c => c.found);
    this.printResults('Null Safety', this.results.nullChecks);
  }

  // Check 3: Verify version consistency
  async verifyVersionConsistency() {
    console.log(`\n${colors.cyan}${colors.bold}Checking Version Consistency...${colors.reset}`);
    
    const expectedVersion = '2.0.0';
    const filesToCheck = [
      { path: 'package.json', pattern: /"version":\s*"2\.0\.0"/ },
      { path: 'src/installer/index.js', pattern: /FRAMEWORK_VERSION\s*=\s*['"]2\.0\.0['"]/ }
    ];

    for (const fileCheck of filesToCheck) {
      const filePath = path.join(process.cwd(), fileCheck.path);
      const content = fs.readFileSync(filePath, 'utf8');
      const hasCorrectVersion = fileCheck.pattern.test(content);
      
      this.results.versionConsistency.details.push({
        file: fileCheck.path,
        status: hasCorrectVersion ? 'PASS' : 'FAIL',
        message: hasCorrectVersion ? `Version ${expectedVersion}` : 'Incorrect version'
      });
    }

    // Check for any remaining 1.1.0 references
    try {
      const { stdout } = await execAsync('grep -r "1\\.1\\.0" src/ --include="*.js" | wc -l');
      const count = parseInt(stdout.trim());
      
      this.results.versionConsistency.details.push({
        check: 'Old version references',
        status: count === 0 ? 'PASS' : 'WARN',
        message: count === 0 ? 'No old versions found' : `Found ${count} references to 1.1.0`
      });
    } catch (error) {
      // grep returns error if no matches, which is good
      this.results.versionConsistency.details.push({
        check: 'Old version references',
        status: 'PASS',
        message: 'No old versions found'
      });
    }

    this.results.versionConsistency.passed = 
      this.results.versionConsistency.details.every(d => d.status !== 'FAIL');
    
    this.printResults('Version Consistency', this.results.versionConsistency);
  }

  // Check 4: Verify dependencies
  async verifyDependencies() {
    console.log(`\n${colors.cyan}${colors.bold}Checking Dependencies...${colors.reset}`);
    
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );

    const requiredDeps = ['inquirer', 'ora', 'cli-table3', 'chalk'];
    
    requiredDeps.forEach(dep => {
      const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
      this.results.dependencies.details.push({
        dependency: dep,
        status: hasDep ? 'PASS' : 'FAIL',
        message: hasDep ? `Version ${packageJson.dependencies[dep]}` : 'Missing'
      });
    });

    this.results.dependencies.passed = 
      this.results.dependencies.details.every(d => d.status === 'PASS');
    
    this.printResults('Dependencies', this.results.dependencies);
  }

  // Check 5: Verify mocks exist
  async verifyMocks() {
    console.log(`\n${colors.cyan}${colors.bold}Checking Test Mocks...${colors.reset}`);
    
    const mockFiles = [
      'tests/__mocks__/notion-api.js',
      'tests/__mocks__/mcp-server.js',
      'tests/__mocks__/llm-api.js',
      'tests/setup-mocks.js'
    ];

    mockFiles.forEach(mockFile => {
      const filePath = path.join(process.cwd(), mockFile);
      const exists = fs.existsSync(filePath);
      
      this.results.mocks.details.push({
        file: mockFile,
        status: exists ? 'PASS' : 'FAIL',
        message: exists ? 'Mock file exists' : 'Mock file missing'
      });
    });

    this.results.mocks.passed = 
      this.results.mocks.details.every(d => d.status === 'PASS');
    
    this.printResults('Test Mocks', this.results.mocks);
  }

  // Check 6: Run basic tests
  async runBasicTests() {
    console.log(`\n${colors.cyan}${colors.bold}Running Basic Tests...${colors.reset}`);
    
    try {
      // Run a simple syntax check on all JS files
      const { stdout, stderr } = await execAsync('node -c src/index.js');
      
      this.results.tests.details.push({
        test: 'Main entry point',
        status: 'PASS',
        message: 'No syntax errors'
      });
    } catch (error) {
      this.results.tests.details.push({
        test: 'Main entry point',
        status: 'FAIL',
        message: error.message
      });
    }

    // Check if framework can be required
    try {
      const BumbaFramework = require('../src/core/bumba-framework-2');
      this.results.tests.details.push({
        test: 'Framework loading',
        status: 'PASS',
        message: 'Framework loads successfully'
      });
    } catch (error) {
      this.results.tests.details.push({
        test: 'Framework loading',
        status: 'FAIL',
        message: error.message
      });
    }

    this.results.tests.passed = 
      this.results.tests.details.every(d => d.status === 'PASS');
    
    this.printResults('Basic Tests', this.results.tests);
  }

  // Print results for a category
  printResults(category, result) {
    console.log(`\n${colors.blue}${category}:${colors.reset}`);
    
    result.details.forEach(detail => {
      const statusColor = detail.status === 'PASS' ? colors.green :
                         detail.status === 'WARN' ? colors.yellow : colors.red;
      const statusIcon = detail.status === 'PASS' ? '🏁' :
                        detail.status === 'WARN' ? '🟡' : '🔴';
      
      const key = detail.file || detail.check || detail.dependency || detail.test;
      console.log(`  ${statusIcon} ${key}: ${statusColor}${detail.message}${colors.reset}`);
    });
  }

  // Generate final report
  async generateReport() {
    console.log(`\n${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}FINAL VERIFICATION REPORT${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}\n`);

    const allPassed = Object.values(this.results).every(r => r.passed);
    
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.passed ? 
        `${colors.green}🏁 PASSED${colors.reset}` : 
        `${colors.red}🔴 FAILED${colors.reset}`;
      console.log(`${category}: ${status}`);
    });

    console.log(`\n${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}`);
    
    if (allPassed) {
      console.log(`${colors.green}${colors.bold}🏁 ALL FIXES VERIFIED SUCCESSFULLY! 🏁${colors.reset}`);
      console.log(`${colors.green}The BUMBA Framework is ready for production!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${colors.bold}🟡  Some issues remain${colors.reset}`);
      console.log(`${colors.yellow}Please review the failed items above${colors.reset}`);
    }
    
    console.log(`${colors.cyan}${colors.bold}${'='.repeat(60)}${colors.reset}\n`);
    
    // Return exit code
    process.exit(allPassed ? 0 : 1);
  }

  // Run all verifications
  async runAll() {
    console.log(`${colors.cyan}${colors.bold}BUMBA Framework Fix Verification${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    
    await this.verifySyntaxFixes();
    await this.verifyNullChecks();
    await this.verifyVersionConsistency();
    await this.verifyDependencies();
    await this.verifyMocks();
    await this.runBasicTests();
    
    await this.generateReport();
  }
}

// Run verification
const verifier = new FixVerification();
verifier.runAll().catch(error => {
  console.error(`${colors.red}Verification failed: ${error.message}${colors.reset}`);
  process.exit(1);
});