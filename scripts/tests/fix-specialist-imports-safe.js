#!/usr/bin/env node

/**
 * Safe Specialist Import Fixer
 * Carefully fixes import paths for UnifiedSpecialistBase
 */

const fs = require('fs');
const path = require('path');

// Track all changes for review
const changes = [];

function getRelativePathToBase(filePath) {
  // Calculate how many levels up we need to go
  const specialistsDir = '/Users/az/Code/bumba/src/core/specialists';
  const relativePath = path.relative(specialistsDir, filePath);
  const depth = relativePath.split('/').length - 1; // -1 for the filename
  
  // Build the relative path
  let pathToBase = '';
  for (let i = 0; i < depth; i++) {
    pathToBase += '../';
  }
  pathToBase += 'unified-specialist-base';
  
  return pathToBase;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // Check for import issues
  const importPatterns = [
    /const\s+{\s*SpecialistAgent\s*}\s*=\s*require\(['"](.*?)['"]\)/,
    /const\s+UnifiedSpecialistBase\s*=\s*require\(['"](.*?)['"]\)/,
    /const\s+SpecialistAgent\s*=\s*require\(['"](.*?)['"]\)/
  ];
  
  let hasImport = false;
  let importLine = -1;
  let currentImportPath = '';
  
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of importPatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        hasImport = true;
        importLine = i;
        currentImportPath = match[1];
        
        // Check if it's trying to import unified-specialist-base
        if (currentImportPath.includes('unified-specialist-base')) {
          issues.push({
            line: i + 1,
            issue: 'Import path for unified-specialist-base',
            current: lines[i],
            currentPath: currentImportPath
          });
        }
        break;
      }
    }
  }
  
  // Check if class extends UnifiedSpecialistBase
  const extendsPattern = /class\s+\w+\s+extends\s+(UnifiedSpecialistBase|SpecialistAgent)/;
  let extendsLine = -1;
  let extendsBase = '';
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(extendsPattern);
    if (match) {
      extendsLine = i;
      extendsBase = match[1];
      
      if (!hasImport) {
        issues.push({
          line: i + 1,
          issue: `Class extends ${extendsBase} but no import found`,
          current: lines[i]
        });
      } else if (extendsBase === 'UnifiedSpecialistBase' && !content.includes('const UnifiedSpecialistBase')) {
        issues.push({
          line: i + 1,
          issue: 'Class extends UnifiedSpecialistBase but import is incorrect',
          current: lines[i]
        });
      }
      break;
    }
  }
  
  return {
    filePath,
    hasIssues: issues.length > 0,
    issues,
    extendsBase,
    currentImportPath
  };
}

function fixFile(filePath, analysis) {
  if (!analysis.hasIssues) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const correctPath = getRelativePathToBase(filePath);
  
  let fixed = content;
  
  // Fix incorrect imports
  fixed = fixed
    // Fix destructured SpecialistAgent import
    .replace(/const\s+{\s*SpecialistAgent\s*}\s*=\s*require\(['"].*?unified-specialist-base['"]\);/g,
             `const UnifiedSpecialistBase = require('${correctPath}');`)
    // Fix direct SpecialistAgent import  
    .replace(/const\s+SpecialistAgent\s*=\s*require\(['"].*?unified-specialist-base['"]\);/g,
             `const UnifiedSpecialistBase = require('${correctPath}');`)
    // Fix incorrect path for UnifiedSpecialistBase
    .replace(/const\s+UnifiedSpecialistBase\s*=\s*require\(['"]\.\/unified-specialist-base['"]\);/g,
             `const UnifiedSpecialistBase = require('${correctPath}');`)
    // Fix extends SpecialistAgent to UnifiedSpecialistBase
    .replace(/class\s+(\w+)\s+extends\s+SpecialistAgent/g,
             'class $1 extends UnifiedSpecialistBase');
  
  if (fixed !== content) {
    // Record the change
    changes.push({
      file: filePath,
      relativePath: path.relative('/Users/az/Code/bumba', filePath),
      correctImportPath: correctPath,
      issues: analysis.issues
    });
    
    // Write the fixed file
    fs.writeFileSync(filePath, fixed);
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔍 Analyzing specialist files...\n');

const specialistDirs = [
  { path: '/Users/az/Code/bumba/src/core/specialists/experience', depth: 1 },
  { path: '/Users/az/Code/bumba/src/core/specialists/strategic', depth: 1 },
  { path: '/Users/az/Code/bumba/src/core/specialists/documentation', depth: 1 },
  { path: '/Users/az/Code/bumba/src/core/specialists/specialized', depth: 1 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/languages', depth: 2 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/data-ai', depth: 2 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/database', depth: 2 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/devops', depth: 2 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/qa', depth: 2 },
  { path: '/Users/az/Code/bumba/src/core/specialists/technical/advanced', depth: 2 }
];

const allAnalysis = [];

// First, analyze all files
specialistDirs.forEach(({ path: dirPath, depth }) => {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const analysis = analyzeFile(filePath);
    if (analysis.hasIssues) {
      allAnalysis.push(analysis);
    }
  });
});

// Report findings
console.log(`Found ${allAnalysis.length} files with import issues:\n`);
allAnalysis.forEach((analysis, idx) => {
  console.log(`${idx + 1}. ${path.relative('/Users/az/Code/bumba', analysis.filePath)}`);
  analysis.issues.forEach(issue => {
    console.log(`   Line ${issue.line}: ${issue.issue}`);
  });
});

// Ask for confirmation
console.log(`\n📝 Ready to fix ${allAnalysis.length} files.`);
console.log('This will update import paths to use the correct relative path to unified-specialist-base.');

// Actually fix the files
console.log('\n🔧 Fixing files...\n');
let fixedCount = 0;

allAnalysis.forEach(analysis => {
  if (fixFile(analysis.filePath, analysis)) {
    console.log(`🏁 Fixed: ${path.relative('/Users/az/Code/bumba', analysis.filePath)}`);
    fixedCount++;
  }
});

// Write a report
const reportPath = '/Users/az/Code/bumba/specialist-import-fixes.json';
fs.writeFileSync(reportPath, JSON.stringify(changes, null, 2));

console.log(`\n🟡 Fixed ${fixedCount} files.`);
console.log(`📄 Detailed report saved to: ${reportPath}`);

// Show summary
if (changes.length > 0) {
  console.log('\n📊 Summary of changes:');
  const byDepth = {};
  changes.forEach(change => {
    const depth = change.correctImportPath.split('/').filter(p => p === '..').length;
    if (!byDepth[depth]) byDepth[depth] = 0;
    byDepth[depth]++;
  });
  
  Object.entries(byDepth).forEach(([depth, count]) => {
    const pathExample = '../'.repeat(parseInt(depth)) + 'unified-specialist-base';
    console.log(`  Depth ${depth} (${pathExample}): ${count} files`);
  });
}