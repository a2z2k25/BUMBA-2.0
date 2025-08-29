#!/usr/bin/env node

/**
 * BUMBA CLI 1.0 Rename Script
 * Updates all references from BUMBA Framework to BUMBA CLI 1.0
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Patterns to replace
const replacements = [
  // Main framework names
  { from: /BUMBA Framework v3\.0\.4/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA FRAMEWORK v3\.0\.4/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA Framework v3\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA Framework 3\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA v3\.0\.4/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA 3\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA Framework v2\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA 2\.0\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA 2\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA Framework v1\.0/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA 1\.0 Framework/g, to: 'BUMBA CLI 1.0' },
  { from: /BUMBA 1\.0:/g, to: 'BUMBA CLI 1.0:' },
  { from: /BUMBA Framework Configuration/g, to: 'BUMBA CLI Configuration' },
  { from: /BUMBA Claude Framework/g, to: 'BUMBA CLI' },
  { from: /BUMBA Framework/g, to: 'BUMBA CLI' },
  { from: /BUMBA FRAMEWORK/g, to: 'BUMBA CLI' },
  
  // Keep specific component names but update context
  { from: /BUMBA Claude Code Mastery Framework/g, to: 'BUMBA CLI Mastery System' },
  { from: /BUMBA Framework - /g, to: 'BUMBA CLI - ' },
  { from: /Framework v1\.0 -/g, to: 'CLI 1.0 -' },
];

// Files and directories to skip
const skipPatterns = [
  /node_modules/,
  /\.git/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.svg$/,
  /\.mp3$/,
  /\.mp4$/,
  /\.zip$/,
  /\.tar$/,
  /\.gz$/,
  /rename-to-cli\.js$/, // Skip this script itself
];

let filesUpdated = 0;
let totalReplacements = 0;

/**
 * Process a single file
 */
function processFile(filePath) {
  // Skip if matches skip pattern
  if (skipPatterns.some(pattern => pattern.test(filePath))) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileReplacements = 0;

    // Apply all replacements
    replacements.forEach(({ from, to }) => {
      const matches = updatedContent.match(from);
      if (matches) {
        fileReplacements += matches.length;
        updatedContent = updatedContent.replace(from, to);
      }
    });

    // Write back if changes were made
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(chalk.green('✓') + ' Updated: ' + chalk.cyan(path.relative(process.cwd(), filePath)) + 
                  chalk.gray(` (${fileReplacements} replacements)`));
      filesUpdated++;
      totalReplacements += fileReplacements;
    }
  } catch (error) {
    if (error.code !== 'EISDIR') {
      console.error(chalk.red('✗') + ' Error processing ' + filePath + ':', error.message);
    }
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);
  
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !skipPatterns.some(pattern => pattern.test(fullPath))) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

/**
 * Main execution
 */
console.log(chalk.blue.bold('\n🏁 BUMBA CLI 1.0 Rename Script'));
console.log(chalk.gray('━'.repeat(60)));
console.log();

const startTime = Date.now();

// Process the entire BUMBA directory
const bumbaDir = path.resolve(__dirname, '..');
console.log('Processing directory: ' + chalk.yellow(bumbaDir));
console.log();

processDirectory(bumbaDir);

// Update package.json specifically
const packageJsonPath = path.join(bumbaDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update package.json fields
  packageJson.name = 'bumba-cli';
  packageJson.version = '1.0.0';
  packageJson.description = 'BUMBA CLI 1.0 - Professional AI-enhanced command-line development framework with 100+ specialist agents';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  console.log(chalk.green('✓') + ' Updated: ' + chalk.cyan('package.json') + chalk.gray(' (name, version, description)'));
  filesUpdated++;
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log();
console.log(chalk.gray('━'.repeat(60)));
console.log(chalk.green.bold('\n✅ Rename Complete!'));
console.log();
console.log('📊 Statistics:');
console.log('  Files updated: ' + chalk.yellow(filesUpdated));
console.log('  Total replacements: ' + chalk.yellow(totalReplacements));
console.log('  Time taken: ' + chalk.yellow(duration + 's'));
console.log();
console.log(chalk.blue.bold('🏁 Welcome to BUMBA CLI 1.0!'));
console.log();