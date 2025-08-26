#!/usr/bin/env node

/**
 * Detect Silent Failures
 * Scans for potential runtime issues that could fail silently
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Detecting Potential Silent Failures\n'));

let issues = [];

// Patterns that indicate potential silent failures
const problematicPatterns = [
  {
    name: 'Empty catch blocks',
    pattern: /catch\s*\([^)]*\)\s*{\s*}/g,
    severity: 'high'
  },
  {
    name: 'Catch without logging',
    pattern: /catch\s*\([^)]*\)\s*{\s*(?!.*(?:console|logger|throw))[^}]*}/g,
    severity: 'medium'
  },
  {
    name: 'Optional chaining without fallback',
    pattern: /\?\.\w+(?!\s*(?:\|\||&&|\?|:))/g,
    severity: 'low'
  },
  {
    name: 'Unhandled promise',
    pattern: /new Promise\([^)]*\)(?![\s\S]*\.catch)/g,
    severity: 'medium'
  },
  {
    name: 'Fire and forget async',
    pattern: /(?<!await\s+)(?:this\.|[a-zA-Z_$][\w$]*\.)[\w$]+\s*\([^)]*\)(?:\s*;|\s*$)(?![\s\S]*\.then|[\s\S]*\.catch)/gm,
    severity: 'low'
  }
];

// Common initialization issues
const initializationChecks = [
  {
    name: 'Missing null checks',
    check: (content) => {
      const matches = content.match(/this\.(\w+)\.(\w+)/g) || [];
      return matches.filter(m => !content.includes(`if (this.${m.split('.')[1]}`)).length > 0;
    },
    severity: 'medium'
  },
  {
    name: 'Undefined method calls',
    check: (content) => {
      const calls = content.match(/this\.(\w+)\(/g) || [];
      const definitions = content.match(/(\w+)\s*\([^)]*\)\s*{/g) || [];
      const definedMethods = definitions.map(d => d.split('(')[0].trim());
      return calls.some(call => {
        const method = call.replace('this.', '').replace('(', '');
        return !definedMethods.includes(method) && !content.includes(`this.${method} =`);
      });
    },
    severity: 'high'
  }
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileIssues = [];
  
  // Check patterns
  for (const { name, pattern, severity } of problematicPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      fileIssues.push({
        file: filePath,
        issue: name,
        severity,
        count: matches.length
      });
    }
  }
  
  // Check initialization issues
  for (const { name, check, severity } of initializationChecks) {
    if (check(content)) {
      fileIssues.push({
        file: filePath,
        issue: name,
        severity
      });
    }
  }
  
  return fileIssues;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      const fileIssues = scanFile(fullPath);
      issues = issues.concat(fileIssues);
    }
  }
}

// Scan source directory
scanDirectory(path.join(__dirname, '..', 'src'));

// Report findings
if (issues.length === 0) {
  console.log(chalk.green('🏁 No potential silent failures detected!\n'));
} else {
  // Group by severity
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');
  
  console.log(chalk.red(`\n🟠️ Found ${issues.length} potential issues:\n`));
  
  if (high.length > 0) {
    console.log(chalk.red(`High Severity (${high.length}):`));
    high.forEach(i => {
      console.log(`  ${i.file.replace(process.cwd(), '.')}`);
      console.log(`    Issue: ${i.issue}`);
    });
  }
  
  if (medium.length > 0) {
    console.log(chalk.yellow(`\nMedium Severity (${medium.length}):`));
    medium.slice(0, 5).forEach(i => {
      console.log(`  ${i.file.replace(process.cwd(), '.')}`);
      console.log(`    Issue: ${i.issue}`);
    });
    if (medium.length > 5) {
      console.log(`  ... and ${medium.length - 5} more`);
    }
  }
  
  if (low.length > 0) {
    console.log(chalk.blue(`\nLow Severity (${low.length}):`));
    console.log(`  ${low.length} minor issues found (optional chaining, etc.)`);
  }
}

// Test critical functions
console.log(chalk.cyan('\n🧪 Testing Critical Functions:\n'));

const criticalTests = [
  {
    name: 'Error Manager',
    test: () => {
      const { getInstance } = require('../src/core/error-handling/unified-error-manager');
      const em = getInstance();
      em.handleError(new Error('Test'), { silent: true });
      return true;
    }
  },
  {
    name: 'API Validator',
    test: async () => {
      const { getInstance } = require('../src/core/validation/api-validator');
      const av = getInstance();
      const result = await av.validateAll();
      return result && result.overall;
    }
  },
  {
    name: 'Notion Hub',
    test: async () => {
      const { getInstance } = require('../src/core/integrations/notion-hub');
      const nh = getInstance();
      await nh.initialize();
      return nh.isInFallbackMode !== undefined;
    }
  }
];

Promise.all(criticalTests.map(async ({ name, test }) => {
  try {
    const result = await test();
    if (result) {
      console.log(chalk.green(`  🏁 ${name} - No silent failures`));
    } else {
      console.log(chalk.yellow(`  🟠 ${name} - Returned falsy value`));
    }
  } catch (error) {
    console.log(chalk.red(`  🔴 ${name} - ${error.message}`));
  }
})).then(() => {
  console.log(chalk.cyan('\n📊 Summary:'));
  console.log(`  High severity: ${issues.filter(i => i.severity === 'high').length}`);
  console.log(`  Medium severity: ${issues.filter(i => i.severity === 'medium').length}`);
  console.log(`  Low severity: ${issues.filter(i => i.severity === 'low').length}`);
  
  process.exit(issues.filter(i => i.severity === 'high').length > 0 ? 1 : 0);
});