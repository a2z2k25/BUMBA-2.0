#!/usr/bin/env node

/**
 * BUMBA Production Health Check
 * Validates framework production readiness
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/core/logging/bumba-logger');

class ProductionHealthCheck {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Run comprehensive production health check
   */
  async runHealthCheck() {
    console.log('🏁 BUMBA Production Health Check');
    console.log('='.repeat(50));

    // Core file checks
    this.checkCoreFiles();
    
    // Configuration checks
    this.checkConfigurations();
    
    // Security checks
    this.checkSecurity();
    
    // Performance checks
    this.checkPerformance();
    
    // Documentation checks
    this.checkDocumentation();
    
    // Test coverage
    await this.checkTestCoverage();
    
    // Display results
    this.displayResults();
    
    return {
      issues: this.issues.length,
      warnings: this.warnings.length,
      passed: this.passed.length,
      ready: this.issues.length === 0
    };
  }

  /**
   * Check core framework files
   */
  checkCoreFiles() {
    const coreFiles = [
      'src/index.js',
      'src/core/bumba-framework-2.js',
      'src/core/command-handler.js',
      'src/core/unified-routing-system.js',
      'package.json',
      'README.md'
    ];

    coreFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.passed.push(`🏁 Core file exists: ${file}`);
      } else {
        this.issues.push(`🔴 Missing core file: ${file}`);
      }
    });
  }

  /**
   * Check production configurations
   */
  checkConfigurations() {
    // Package.json validation
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (pkg.version) {
        this.passed.push(`🏁 Version defined: ${pkg.version}`);
      } else {
        this.issues.push('🔴 No version in package.json');
      }
      
      if (pkg.main) {
        this.passed.push(`🏁 Main entry point: ${pkg.main}`);
      } else {
        this.issues.push('🔴 No main entry point');
      }
      
      if (pkg.bin) {
        this.passed.push('🏁 CLI binaries configured');
      } else {
        this.warnings.push('🟡 No CLI binaries configured');
      }
      
    } catch (error) {
      this.issues.push('🔴 Invalid package.json');
    }

    // Environment example
    if (fs.existsSync('.env.example')) {
      this.passed.push('🏁 Environment example provided');
    } else {
      this.warnings.push('🟡 No .env.example file');
    }

    // ESLint config
    if (fs.existsSync('config/.eslintrc.json') || fs.existsSync('config/eslint.config.js')) {
      this.passed.push('🏁 ESLint configuration present');
    } else {
      this.warnings.push('🟡 No ESLint configuration');
    }
  }

  /**
   * Check security configurations
   */
  checkSecurity() {
    // .gitignore check
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      
      if (gitignore.includes('.env')) {
        this.passed.push('🏁 Environment files ignored in git');
      } else {
        this.issues.push('🔴 .env files not ignored in .gitignore');
      }
      
      if (gitignore.includes('node_modules')) {
        this.passed.push('🏁 node_modules ignored in git');
      } else {
        this.issues.push('🔴 node_modules not ignored in .gitignore');
      }
    } else {
      this.issues.push('🔴 No .gitignore file');
    }

    // Check for hardcoded secrets
    const sourceFiles = this.getSourceFiles();
    let secretsFound = false;
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const suspiciousPatterns = [
        /api_key\s*=\s*['"][^'"]+['"]/i,
        /secret\s*=\s*['"][^'"]+['"]/i,
        /password\s*=\s*['"][^'"]+['"]/i,
        /token\s*=\s*['"][^'"]+['"]/i
      ];
      
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.issues.push(`🔴 Potential hardcoded secret in: ${file}`);
          secretsFound = true;
        }
      });
    });
    
    if (!secretsFound) {
      this.passed.push('🏁 No hardcoded secrets detected');
    }
  }

  /**
   * Check performance configurations
   */
  checkPerformance() {
    // Jest config
    if (fs.existsSync('config/jest.config.js')) {
      this.passed.push('🏁 Jest configuration present');
    } else {
      this.warnings.push('🟡 No Jest configuration');
    }

    // Check for large files that shouldn't be committed
    const maxFileSize = 1024 * 1024; // 1MB
    const sourceFiles = this.getSourceFiles();
    
    sourceFiles.forEach(file => {
      const stats = fs.statSync(file);
      if (stats.size > maxFileSize) {
        this.warnings.push(`🟡 Large source file: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      }
    });
  }

  /**
   * Check documentation completeness
   */
  checkDocumentation() {
    const docFiles = [
      'README.md',
      'CONTRIBUTING.md',
      'CHANGELOG.md',
      'LICENSE'
    ];

    docFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.passed.push(`🏁 Documentation present: ${file}`);
      } else {
        this.warnings.push(`🟡 Missing documentation: ${file}`);
      }
    });

    // Check README length (should be concise)
    if (fs.existsSync('README.md')) {
      const readme = fs.readFileSync('README.md', 'utf8');
      const lines = readme.split('\n').length;
      
      if (lines < 500) {
        this.passed.push(`🏁 README is concise (${lines} lines)`);
      } else {
        this.warnings.push(`🟡 README is very long (${lines} lines)`);
      }
    }
  }

  /**
   * Check test coverage
   */
  async checkTestCoverage() {
    // Check if tests exist
    const testDirs = ['tests/', 'test/', '__tests__/'];
    let testsFound = false;
    
    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        testsFound = true;
        this.passed.push(`🏁 Test directory found: ${dir}`);
      }
    });
    
    if (!testsFound) {
      this.warnings.push('🟡 No test directories found');
    }

    // Check package.json test scripts
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.scripts && pkg.scripts.test) {
        this.passed.push('🏁 Test script configured');
      } else {
        this.warnings.push('🟡 No test script in package.json');
      }
    } catch (error) {
      // Already handled in checkConfigurations
    }
  }

  /**
   * Get all source files
   */
  getSourceFiles() {
    const files = [];
    
    function walkDir(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(itemPath);
        } else if (stats.isFile() && item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
          files.push(itemPath);
        }
      });
    }
    
    walkDir('src');
    return files;
  }

  /**
   * Display health check results
   */
  displayResults() {
    console.log('\n🟢 Health Check Results');
    console.log('='.repeat(50));
    
    console.log(`\n🏁 Passed: ${this.passed.length}`);
    this.passed.forEach(item => console.log(`  ${item}`));
    
    if (this.warnings.length > 0) {
      console.log(`\n🟡  Warnings: ${this.warnings.length}`);
      this.warnings.forEach(item => console.log(`  ${item}`));
    }
    
    if (this.issues.length > 0) {
      console.log(`\n🔴 Issues: ${this.issues.length}`);
      this.issues.forEach(item => console.log(`  ${item}`));
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log('🏁 PRODUCTION READY! All critical checks passed.');
    } else {
      console.log('🔴 NOT PRODUCTION READY! Please fix the issues above.');
    }
    
    console.log(`🟢 Score: ${this.passed.length}/${this.passed.length + this.issues.length} critical checks passed`);
  }
}

// CLI execution
if (require.main === module) {
  const checker = new ProductionHealthCheck();
  checker.runHealthCheck()
    .then(result => {
      process.exit(result.ready ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionHealthCheck;