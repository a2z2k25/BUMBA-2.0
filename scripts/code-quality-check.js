#!/usr/bin/env node

/**
 * Code Quality Check
 * Ensures basic code quality standards
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

console.log(chalk.blue('🔍 Code Quality Check\n'));

let issues = [];
let fixed = 0;

// Core files to check
const coreFiles = [
  'src/index.js',
  'src/core/bumba-framework-2.js',
  'src/core/command-handler.js',
  'src/core/error-handling/unified-error-manager.js',
  'src/core/validation/api-validator.js',
  'src/core/integrations/notion-hub.js',
  'src/core/configuration/configuration-manager.js',
  'src/core/resource-management/resource-enforcer.js'
];

// Quality checks
const checks = {
  'Console.log statements': {
    pattern: /console\.log\(/g,
    severity: 'low',
    exclude: ['test', 'scripts']
  },
  'TODO comments': {
    pattern: /\/\/\s*TODO/gi,
    severity: 'low'
  },
  'Debugging code': {
    pattern: /debugger;/g,
    severity: 'high'
  },
  'Hardcoded secrets': {
    pattern: /(?:api[_-]?key|secret|token|password)\s*=\s*["'][^"']+["']/gi,
    severity: 'critical'
  },
  'Unused variables': {
    pattern: /^(?:const|let|var)\s+\w+\s*=.*$/gm,
    severity: 'medium',
    check: (match, content) => {
      const varName = match.match(/(?:const|let|var)\s+(\w+)/)[1];
      const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(usageRegex);
      return matches && matches.length <= 1;
    }
  }
};

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const fileIssues = [];
  
  for (const [name, check] of Object.entries(checks)) {
    // Skip excluded paths
    if (check.exclude) {
      const shouldExclude = check.exclude.some(exc => filePath.includes(exc));
      if (shouldExclude) continue;
    }
    
    const matches = content.match(check.pattern) || [];
    
    for (const match of matches) {
      // Custom check function
      if (check.check && !check.check(match, content)) {
        continue;
      }
      
      fileIssues.push({
        file: filePath,
        issue: name,
        severity: check.severity,
        match: match.substring(0, 50)
      });
    }
  }
  
  return fileIssues;
}

// Check core files
console.log(chalk.cyan('Checking core files:\n'));
for (const file of coreFiles) {
  const fileIssues = checkFile(file);
  if (fileIssues.length > 0) {
    console.log(chalk.yellow(`  ${path.basename(file)}: ${fileIssues.length} issues`));
    issues = issues.concat(fileIssues);
  } else {
    console.log(chalk.green(`  🏁 ${path.basename(file)}`));
  }
}

// Check for common issues
console.log(chalk.cyan('\n📊 Common Issues:\n'));

// Check package.json scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasLint = !!packageJson.scripts.lint;
const hasTest = !!packageJson.scripts.test;
const hasFormat = !!packageJson.scripts.format;

console.log(hasLint ? chalk.green('  🏁 Lint script exists') : chalk.yellow('  🟠 No lint script'));
console.log(hasTest ? chalk.green('  🏁 Test script exists') : chalk.yellow('  🟠 No test script'));
console.log(hasFormat ? chalk.green('  🏁 Format script exists') : chalk.yellow('  🟠 No format script'));

// Check for TypeScript
const hasTypeScript = fs.existsSync('tsconfig.json');
console.log(hasTypeScript ? chalk.green('  🏁 TypeScript configured') : chalk.blue('  - No TypeScript'));

// Check for tests
const testFiles = execSync('find . -name "*.test.js" -o -name "*.spec.js" | wc -l', { encoding: 'utf8' }).trim();
console.log(testFiles > 0 ? chalk.green(`  🏁 ${testFiles} test files found`) : chalk.yellow('  🟠 No test files'));

// Summary
console.log(chalk.cyan('\n📈 Quality Metrics:\n'));

const critical = issues.filter(i => i.severity === 'critical');
const high = issues.filter(i => i.severity === 'high');
const medium = issues.filter(i => i.severity === 'medium');
const low = issues.filter(i => i.severity === 'low');

if (critical.length > 0) {
  console.log(chalk.red(`  Critical: ${critical.length}`));
  critical.forEach(i => {
    console.log(chalk.red(`    ${path.basename(i.file)}: ${i.issue}`));
  });
}

if (high.length > 0) {
  console.log(chalk.red(`  High: ${high.length}`));
}

if (medium.length > 0) {
  console.log(chalk.yellow(`  Medium: ${medium.length}`));
}

if (low.length > 0) {
  console.log(chalk.blue(`  Low: ${low.length}`));
}

// Code coverage estimate
const totalLines = execSync('find src -name "*.js" | xargs wc -l | tail -1', { encoding: 'utf8' }).match(/\d+/)[0];
const testCoverage = Math.min(100, (testFiles / coreFiles.length) * 100).toFixed(1);

console.log(chalk.cyan('\n📊 Coverage Estimate:'));
console.log(`  Core files: ${coreFiles.length}`);
console.log(`  Test files: ${testFiles}`);
console.log(`  Estimated coverage: ${testCoverage}%`);
console.log(`  Total lines: ${totalLines}`);

// Recommendations
console.log(chalk.cyan('\n💡 Recommendations:\n'));

if (!hasFormat) {
  console.log(chalk.yellow('  1. Add format script: "format": "prettier --write src/**/*.js"'));
}

if (critical.length > 0) {
  console.log(chalk.red('  2. Fix critical security issues immediately'));
}

if (testFiles < 10) {
  console.log(chalk.yellow('  3. Add more test coverage'));
}

if (!hasTypeScript) {
  console.log(chalk.blue('  4. Consider adding TypeScript for type safety'));
}

// Final score
const qualityScore = Math.max(0, 100 - (critical.length * 25) - (high.length * 10) - (medium.length * 5) - (low.length * 1));
console.log(chalk.cyan('\n🏁 Quality Score: ') + (
  qualityScore >= 80 ? chalk.green(`${qualityScore}%`) :
  qualityScore >= 60 ? chalk.yellow(`${qualityScore}%`) :
  chalk.red(`${qualityScore}%`)
));

if (qualityScore >= 80) {
  console.log(chalk.green('\n🏁 Code quality is acceptable for production'));
} else if (qualityScore >= 60) {
  console.log(chalk.yellow('\n🟠️ Code quality needs improvement before production'));
} else {
  console.log(chalk.red('\n🔴 Code quality is not ready for production'));
}

process.exit(critical.length > 0 ? 1 : 0);