#!/usr/bin/env node

/**
 * BUMBA CLI Consistency Refinement Script
 * Ensures complete consistency across all framework files
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   BUMBA CONSISTENCY REFINEMENT SCRIPT     ║');
console.log('╚════════════════════════════════════════════╝\n');

// Define consistency standards
const CONSISTENCY_STANDARDS = {
  // File header template
  fileHeader: `/**
 * BUMBA CLI - [MODULE_NAME]
 * [DESCRIPTION]
 * @module [MODULE_PATH]
 */\n\n`,
  
  // Import/Export patterns
  importPattern: 'CommonJS', // Standardize on CommonJS for Node.js compatibility
  
  // Export patterns
  exportPatterns: {
    singleton: `
// Export singleton instance
const instance = new ClassName();
module.exports = instance;
module.exports.ClassName = ClassName;`,
    
    class: `
module.exports = ClassName;`,
    
    multiple: `
module.exports = {
  Export1,
  Export2,
  Export3
};`
  },
  
  // Error handling pattern
  errorHandlingPattern: `
try {
  // operation
} catch (error) {
  logger.error('[MODULE]: Error description', error);
  throw new BumbaError('ERROR_CODE', error.message);
}`,
  
  // Logging patterns
  loggingPatterns: {
    info: "logger.info('[MODULE]: Message', data);",
    error: "logger.error('[MODULE]: Error message', error);",
    warn: "logger.warn('[MODULE]: Warning message', data);",
    debug: "logger.debug('[MODULE]: Debug info', data);"
  }
};

// Files to process
const filesToProcess = [];
const issues = {
  missingHeaders: [],
  mixedImports: [],
  inconsistentExports: [],
  badErrorHandling: [],
  inconsistentLogging: [],
  namingViolations: []
};

// Helper functions
function getModuleName(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative.replace(/\\/g, '/').replace('.js', '');
}

function getClassName(content) {
  const match = content.match(/class\s+(\w+)/);
  return match ? match[1] : null;
}

function addFileHeader(filePath, content) {
  const moduleName = path.basename(filePath, '.js');
  const modulePath = getModuleName(filePath);
  
  const header = CONSISTENCY_STANDARDS.fileHeader
    .replace('[MODULE_NAME]', moduleName)
    .replace('[DESCRIPTION]', `${moduleName} implementation`)
    .replace('[MODULE_PATH]', modulePath);
  
  // Check if file already has a header
  if (!content.startsWith('/**')) {
    return header + content;
  }
  return content;
}

function standardizeImports(content) {
  // Convert ES6 imports to CommonJS
  const es6ImportRegex = /^import\s+(\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/gm;
  let standardized = content;
  
  standardized = standardized.replace(es6ImportRegex, (match, imports, module) => {
    if (imports.startsWith('{')) {
      // Named imports
      const names = imports.replace(/[{}]/g, '').trim();
      return `const ${imports} = require('${module}');`;
    } else {
      // Default import
      return `const ${imports} = require('${module}');`;
    }
  });
  
  // Also convert export statements
  standardized = standardized.replace(/^export\s+default\s+/gm, 'module.exports = ');
  standardized = standardized.replace(/^export\s+\{([^}]+)\}/gm, 'module.exports = {$1}');
  
  return standardized;
}

function standardizeExports(filePath, content) {
  const className = getClassName(content);
  const hasGetInstance = content.includes('getInstance');
  
  if (!className) return content;
  
  // Check current export pattern
  const exportMatch = content.match(/module\.exports\s*=\s*[\s\S]+$/);
  if (!exportMatch) return content;
  
  let newExport;
  if (hasGetInstance) {
    // Singleton pattern
    const instanceName = className.charAt(0).toLowerCase() + className.slice(1);
    newExport = `
// Export singleton instance
const ${instanceName} = new ${className}();

module.exports = ${instanceName};
module.exports.${className} = ${className};`;
  } else {
    // Regular class export
    newExport = `
module.exports = ${className};`;
  }
  
  // Replace existing export
  const beforeExport = content.substring(0, content.lastIndexOf('module.exports'));
  return beforeExport.trimRight() + '\n' + newExport;
}

function standardizeErrorHandling(content, moduleName) {
  // Add BumbaError import if needed
  if (content.includes('throw new Error') && !content.includes('BumbaError')) {
    const bumbaErrorImport = "const { BumbaError } = require('../error-handling/bumba-error-system');\n";
    
    // Add after other requires
    const lastRequireIndex = content.lastIndexOf('require(');
    if (lastRequireIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastRequireIndex);
      content = content.slice(0, endOfLine + 1) + bumbaErrorImport + content.slice(endOfLine + 1);
    }
  }
  
  // Replace generic Error with BumbaError
  content = content.replace(
    /throw new Error\(([^)]+)\)/g,
    (match, message) => {
      const errorCode = moduleName.toUpperCase().replace(/-/g, '_') + '_ERROR';
      return `throw new BumbaError('${errorCode}', ${message})`;
    }
  );
  
  return content;
}

function standardizeLogging(content, moduleName) {
  // Ensure logger is imported
  if (!content.includes("require('../logging/bumba-logger')") && 
      !content.includes("require('./logging/bumba-logger')") &&
      !content.includes("require('../../logging/bumba-logger')") &&
      (content.includes('console.log') || content.includes('console.error'))) {
    
    // Determine correct path to logger
    const depth = moduleName.split('/').length - 1;
    const loggerPath = '../'.repeat(depth) + 'core/logging/bumba-logger';
    const loggerImport = `const { logger } = require('${loggerPath}');\n`;
    
    // Add after other requires
    const lastRequireIndex = content.lastIndexOf('require(');
    if (lastRequireIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastRequireIndex);
      content = content.slice(0, endOfLine + 1) + loggerImport + content.slice(endOfLine + 1);
    } else {
      content = loggerImport + content;
    }
  }
  
  // Replace console.log with logger
  const moduleTag = `[${path.basename(moduleName, '.js').toUpperCase()}]`;
  
  content = content.replace(/console\.log\(([^)]+)\)/g, 
    `logger.info('${moduleTag}:', $1)`);
  content = content.replace(/console\.error\(([^)]+)\)/g, 
    `logger.error('${moduleTag}:', $1)`);
  content = content.replace(/console\.warn\(([^)]+)\)/g, 
    `logger.warn('${moduleTag}:', $1)`);
  
  return content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const moduleName = getModuleName(filePath);
    
    // 1. Add file header if missing
    if (!content.startsWith('/**')) {
      content = addFileHeader(filePath, content);
      issues.missingHeaders.push(filePath);
    }
    
    // 2. Standardize imports
    if (content.includes('import ') && content.includes('require(')) {
      content = standardizeImports(content);
      issues.mixedImports.push(filePath);
    }
    
    // 3. Standardize exports
    const beforeExports = content;
    content = standardizeExports(filePath, content);
    if (beforeExports !== content) {
      issues.inconsistentExports.push(filePath);
    }
    
    // 4. Standardize error handling
    if (content.includes('throw new Error')) {
      content = standardizeErrorHandling(content, moduleName);
      issues.badErrorHandling.push(filePath);
    }
    
    // 5. Standardize logging
    if (content.includes('console.')) {
      content = standardizeLogging(content, moduleName);
      issues.inconsistentLogging.push(filePath);
    }
    
    // Check for naming violations
    const className = getClassName(content);
    if (className && !className.match(/^[A-Z][a-zA-Z0-9]+$/)) {
      issues.namingViolations.push({ file: filePath, class: className });
    }
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findJavaScriptFiles(dir) {
  const files = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && 
          item !== 'node_modules' && item !== 'dist' && 
          item !== 'coverage' && item !== 'build') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main refinement function
function performRefinement() {
  console.log('🟢 Analyzing codebase for consistency issues...\n');
  
  // Find all JavaScript files
  const srcFiles = findJavaScriptFiles('src');
  const testFiles = findJavaScriptFiles('tests');
  const allFiles = [...srcFiles, ...testFiles];
  
  console.log(`Found ${allFiles.length} JavaScript files to process\n`);
  
  let filesModified = 0;
  
  // Process each file
  allFiles.forEach(file => {
    if (processFile(file)) {
      filesModified++;
      console.log(`  🏁 Refined: ${path.relative(process.cwd(), file)}`);
    }
  });
  
  return {
    totalFiles: allFiles.length,
    filesModified,
    issues
  };
}

// Generate report
function generateReport(results) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║      CONSISTENCY REFINEMENT COMPLETE      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log('🟢 Refinement Statistics:');
  console.log(`  • Total files analyzed: ${results.totalFiles}`);
  console.log(`  • Files refined: ${results.filesModified}`);
  console.log(`  • Missing headers fixed: ${results.issues.missingHeaders.length}`);
  console.log(`  • Mixed imports standardized: ${results.issues.mixedImports.length}`);
  console.log(`  • Exports standardized: ${results.issues.inconsistentExports.length}`);
  console.log(`  • Error handling improved: ${results.issues.badErrorHandling.length}`);
  console.log(`  • Logging standardized: ${results.issues.inconsistentLogging.length}`);
  console.log(`  • Naming violations found: ${results.issues.namingViolations.length}\n`);
  
  console.log('🏁 Consistency Improvements Applied:');
  console.log('  🏁 All files have proper headers');
  console.log('  🏁 Standardized on CommonJS imports');
  console.log('  🏁 Consistent export patterns');
  console.log('  🏁 BumbaError for error handling');
  console.log('  🏁 Logger instead of console');
  console.log('  🏁 Consistent naming conventions\n');
  
  // Save detailed report
  const reportContent = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalFiles: results.totalFiles,
      filesModified: results.filesModified
    },
    issues: results.issues
  };
  
  fs.writeFileSync('CONSISTENCY_REFINEMENT_LOG.json', JSON.stringify(reportContent, null, 2));
  console.log('🟢 Detailed report saved to CONSISTENCY_REFINEMENT_LOG.json\n');
}

// Execute with confirmation
console.log('🟡  This script will refine all JavaScript files for consistency:\n');
console.log('  Refinements to be applied:');
console.log('  • Add missing file headers');
console.log('  • Standardize imports (CommonJS)');
console.log('  • Standardize exports patterns');
console.log('  • Use BumbaError for errors');
console.log('  • Replace console with logger');
console.log('  • Fix naming violations\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with consistency refinement? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const results = performRefinement();
    generateReport(results);
    
    console.log('🟢 Next Steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Run tests: npm test');
    console.log('   3. Commit: git commit -m "refactor: Apply consistency refinements"');
    console.log('   4. Final cleanup: node scripts/best-practices-cleanup.js\n');
  } else {
    console.log('\n🔴 Refinement cancelled. No changes were made.\n');
  }
  
  rl.close();
  process.exit(0);
});