#!/usr/bin/env node

/**
 * Script to check naming conventions across the BUMBA codebase
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Naming convention rules
const RULES = {
  files: {
    jsFiles: /^[a-z]+(-[a-z]+)*\.(js|ts)$/,
    testFiles: /^[a-z]+(-[a-z]+)*\.(test|spec)\.(js|ts)$/,
    configFiles: /^[a-z]+(-[a-z]+)*\.(json|js|yml|yaml)$/,
    upperCaseDocs: /^[A-Z_]+\.md$/,
  },
  code: {
    constants: /^[A-Z][A-Z0-9_]*$/,
    variables: /^[a-z][a-zA-Z0-9]*$/,
    functions: /^[a-z][a-zA-Z0-9]*$/,
    classes: /^[A-Z][a-zA-Z0-9]*$/,
    privateMembers: /^_[a-z][a-zA-Z0-9]*$/,
    booleans: /^(is|has|can|should|will|did)[A-Z][a-zA-Z0-9]*$/,
  },
};

class NamingConventionChecker {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.stats = {
      filesChecked: 0,
      violations: 0,
      warnings: 0,
    };
  }

  /**
   * Check all files in the project
   */
  async checkProject() {
    console.log('🟢 Checking BUMBA naming conventions...\n');

    // Get all JavaScript files
    const files = await glob('src/**/*.{js,ts}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    for (const file of files) {
      await this.checkFile(file);
    }

    this.reportResults();
  }

  /**
   * Check a single file
   */
  async checkFile(filePath) {
    this.stats.filesChecked++;
    
    // Check filename
    this.checkFileName(filePath);
    
    // Check file contents
    const content = fs.readFileSync(filePath, 'utf8');
    this.checkFileContent(filePath, content);
  }

  /**
   * Check filename conventions
   */
  checkFileName(filePath) {
    const fileName = path.basename(filePath);
    const isTest = fileName.includes('.test.') || fileName.includes('.spec.');
    
    if (isTest) {
      if (!RULES.files.testFiles.test(fileName)) {
        this.addViolation('file-naming', filePath, 
          `Test file should use kebab-case: ${fileName}`);
      }
    } else {
      if (!RULES.files.jsFiles.test(fileName)) {
        this.addViolation('file-naming', filePath, 
          `JavaScript file should use kebab-case: ${fileName}`);
      }
    }
    
    // Check for module type suffixes
    this.checkModuleTypeSuffix(filePath, fileName);
  }

  /**
   * Check module type suffixes
   */
  checkModuleTypeSuffix(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('class') && content.includes('Service') && !fileName.includes('-service')) {
      this.addWarning('file-naming', filePath, 
        'Service class file should have -service suffix');
    }
    
    if (content.includes('class') && content.includes('Manager') && !fileName.includes('-manager')) {
      this.addWarning('file-naming', filePath, 
        'Manager class file should have -manager suffix');
    }
    
    if (content.includes('validate') && !fileName.includes('-validator')) {
      this.addWarning('file-naming', filePath, 
        'Validator file might need -validator suffix');
    }
  }

  /**
   * Check file content for naming violations
   */
  checkFileContent(filePath, content) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || !line.trim()) {
        return;
      }
      
      // Check constants
      this.checkConstants(filePath, line, lineNumber);
      
      // Check functions
      this.checkFunctions(filePath, line, lineNumber);
      
      // Check classes
      this.checkClasses(filePath, line, lineNumber);
      
      // Check variables
      this.checkVariables(filePath, line, lineNumber);
    });
  }

  /**
   * Check constant naming
   */
  checkConstants(filePath, line, lineNumber) {
    const constPattern = /const\s+([A-Z_][A-Z0-9_]*)\s*=/;
    const match = line.match(constPattern);
    
    if (match && line.includes('=') && !line.includes('=>')) {
      const name = match[1];
      
      // Check if it looks like a constant (all caps or has underscore)
      if (name === name.toUpperCase() && !RULES.code.constants.test(name)) {
        this.addViolation('constant-naming', filePath, 
          `Invalid constant name: ${name} at line ${lineNumber}`);
      }
    }
  }

  /**
   * Check function naming
   */
  checkFunctions(filePath, line, lineNumber) {
    const functionPatterns = [
      /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\(/,
      /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*async\s*\(/,
    ];
    
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1];
        
        // Skip if it's a class or component (PascalCase)
        if (name[0] === name[0].toUpperCase()) continue;
        
        // Check naming convention
        if (!RULES.code.functions.test(name) && !name.startsWith('_')) {
          this.addViolation('function-naming', filePath, 
            `Function should use camelCase: ${name} at line ${lineNumber}`);
        }
        
        // Check boolean functions
        if (line.includes('return true') || line.includes('return false')) {
          if (!name.match(/^(is|has|can|should|will|did)/)) {
            this.addWarning('function-naming', filePath, 
              `Boolean function should start with is/has/can: ${name} at line ${lineNumber}`);
          }
        }
      }
    }
  }

  /**
   * Check class naming
   */
  checkClasses(filePath, line, lineNumber) {
    const classPattern = /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/;
    const match = line.match(classPattern);
    
    if (match) {
      const name = match[1];
      
      if (!RULES.code.classes.test(name)) {
        this.addViolation('class-naming', filePath, 
          `Class should use PascalCase: ${name} at line ${lineNumber}`);
      }
      
      // Check for Error suffix
      if (line.includes('extends Error') && !name.endsWith('Error')) {
        this.addWarning('class-naming', filePath, 
          `Error class should end with 'Error': ${name} at line ${lineNumber}`);
      }
    }
  }

  /**
   * Check variable naming
   */
  checkVariables(filePath, line, lineNumber) {
    const varPatterns = [
      /(?:let|const)\s+([a-z_][a-zA-Z0-9_]*)\s*=/,
    ];
    
    for (const pattern of varPatterns) {
      const match = line.match(pattern);
      if (match && !line.includes('=>') && !line.match(/[A-Z_]+/)) {
        const name = match[1];
        
        // Check boolean variables
        if ((line.includes('= true') || line.includes('= false')) && 
            !name.match(/^(is|has|can|should|will|did)/)) {
          this.addWarning('variable-naming', filePath, 
            `Boolean variable should start with is/has/can: ${name} at line ${lineNumber}`);
        }
      }
    }
  }

  /**
   * Add a violation
   */
  addViolation(type, file, message) {
    this.violations.push({ type, file, message });
    this.stats.violations++;
  }

  /**
   * Add a warning
   */
  addWarning(type, file, message) {
    this.warnings.push({ type, file, message });
    this.stats.warnings++;
  }

  /**
   * Report results
   */
  reportResults() {
    console.log('\n🟢 Naming Convention Check Results\n');
    console.log(`Files checked: ${this.stats.filesChecked}`);
    console.log(`Violations found: ${this.stats.violations}`);
    console.log(`Warnings found: ${this.stats.warnings}`);
    
    if (this.violations.length > 0) {
      console.log('\n🔴 Violations:');
      this.violations.forEach(v => {
        console.log(`  ${v.file}`);
        console.log(`    → ${v.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n🟡  Warnings:');
      this.warnings.forEach(w => {
        console.log(`  ${w.file}`);
        console.log(`    → ${w.message}`);
      });
    }
    
    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('\n🏁 All files follow naming conventions!');
    } else {
      console.log('\n🟢 See NAMING_CONVENTIONS.md for guidelines');
    }
    
    // Exit with error if violations found
    if (this.violations.length > 0) {
      process.exit(1);
    }
  }
}

// Run the checker
const checker = new NamingConventionChecker();
checker.checkProject().catch(console.error);