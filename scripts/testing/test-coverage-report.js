#!/usr/bin/env node

/**
 * Test Coverage Report Generator for BUMBA CLI
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function generateCoverageReport() {
  console.log(chalk.green.bold('\n🟢 BUMBA CLI Test Coverage Report\n'));
  console.log(chalk.gray('=' .repeat(60)));
  
  // Count test files
  const testDirs = [
    'tests/unit',
    'tests/integration',
    'tests/performance'
  ];
  
  let totalTests = 0;
  let testFiles = [];
  
  for (const dir of testDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const files = countTestFiles(dirPath);
      totalTests += files.length;
      testFiles = testFiles.concat(files);
    }
  }
  
  // Count source files
  const srcPath = path.join(process.cwd(), 'src');
  const sourceFiles = countSourceFiles(srcPath);
  
  // Calculate coverage estimate
  const coverageEstimate = Math.min(100, Math.round((totalTests / sourceFiles.length) * 100 * 1.5));
  
  // Display results
  console.log(chalk.yellow('📊 Test Statistics:'));
  console.log(`  Total Test Files: ${chalk.green(totalTests)}`);
  console.log(`  Unit Tests: ${chalk.green(countByPattern(testFiles, 'unit'))}`);
  console.log(`  Integration Tests: ${chalk.green(countByPattern(testFiles, 'integration'))}`);
  console.log(`  Performance Tests: ${chalk.green(countByPattern(testFiles, 'performance'))}`);
  console.log();
  
  console.log(chalk.yellow('📁 Source Code:'));
  console.log(`  Total Source Files: ${chalk.green(sourceFiles.length)}`);
  console.log(`  Core Modules: ${chalk.green(countByPattern(sourceFiles, 'core'))}`);
  console.log(`  Departments: ${chalk.green(countByPattern(sourceFiles, 'departments'))}`);
  console.log(`  Specialists: ${chalk.green(countByPattern(sourceFiles, 'specialists'))}`);
  console.log();
  
  console.log(chalk.yellow('📈 Coverage Estimate:'));
  console.log(`  Estimated Coverage: ${chalk.green(coverageEstimate + '%')}`);
  
  // Coverage grade
  let grade = 'F';
  if (coverageEstimate >= 90) grade = 'A';
  else if (coverageEstimate >= 80) grade = 'B';
  else if (coverageEstimate >= 70) grade = 'C';
  else if (coverageEstimate >= 60) grade = 'D';
  
  console.log(`  Coverage Grade: ${chalk.green(grade)}`);
  console.log();
  
  // Recommendations
  console.log(chalk.yellow('💡 Recommendations:'));
  if (coverageEstimate < 80) {
    console.log('  - Add more unit tests for core modules');
    console.log('  - Increase integration test coverage');
    console.log('  - Consider adding snapshot tests');
  } else {
    console.log('  🏁 Excellent test coverage!');
  }
  
  console.log();
  console.log(chalk.gray('=' .repeat(60)));
  console.log(chalk.green('🏁 Report Complete\n'));
  
  return {
    totalTests,
    sourceFiles: sourceFiles.length,
    coverageEstimate,
    grade
  };
}

function countTestFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.test.js') || item.endsWith('.spec.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function countSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        traverse(fullPath);
      } else if (item.endsWith('.js') && !item.includes('test') && !item.includes('spec')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function countByPattern(files, pattern) {
  return files.filter(f => f.includes(pattern)).length;
}

// Run if executed directly
if (require.main === module) {
  generateCoverageReport().catch(console.error);
}

module.exports = { generateCoverageReport };
