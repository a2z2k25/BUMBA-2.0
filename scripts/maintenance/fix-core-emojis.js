#!/usr/bin/env node

/**
 * BUMBA Emoji Replacement Script
 * Safely replaces unauthorized emojis with approved ones
 * Creates backups before making changes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load replacement map
const replacementMap = require('./emoji-replacement-map.json');

// Counters for reporting
let filesProcessed = 0;
let filesModified = 0;
let totalReplacements = 0;
const replacementDetails = {};

/**
 * Create backup of file
 */
function createBackup(filePath) {
  const backupPath = filePath + '.emoji-backup';
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    // Skip backup files
    if (filePath.includes('.backup') || filePath.includes('.emoji-backup')) {
      return;
    }

    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;

    // Apply replacements
    for (const [oldEmoji, newEmoji] of Object.entries(replacementMap.replacements)) {
      if (content.includes(oldEmoji)) {
        const regex = new RegExp(oldEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        
        if (count > 0) {
          content = content.replace(regex, newEmoji);
          fileReplacements += count;
          
          // Track replacement details
          if (!replacementDetails[oldEmoji]) {
            replacementDetails[oldEmoji] = { 
              to: newEmoji, 
              count: 0, 
              files: [] 
            };
          }
          replacementDetails[oldEmoji].count += count;
          replacementDetails[oldEmoji].files.push(filePath);
        }
      }
    }

    // If content changed, write it back
    if (content !== originalContent) {
      // Create backup first
      const backupPath = createBackup(filePath);
      
      // Write modified content
      fs.writeFileSync(filePath, content, 'utf8');
      
      filesModified++;
      totalReplacements += fileReplacements;
      
      console.log(`🏁 Fixed ${filePath} (${fileReplacements} replacements, backup: ${backupPath})`);
    }
    
    filesProcessed++;
  } catch (error) {
    console.error(`🔴 Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('=== BUMBA Emoji Replacement Script ===');
  console.log('');
  console.log('Authorized emojis: 🟡 🟢 🔴 🟠 🏁');
  console.log('');
  
  // Find all relevant files
  const patterns = [
    'src/**/*.js',
    'src/**/*.jsx',
    'tests/**/*.js',
    'docs/**/*.md',
    '*.md',
    'scripts/**/*.js',
    'config/**/*.js'
  ];
  
  console.log('Scanning for files to process...');
  
  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/bumba-logs/**', '**/*.backup', '**/*.emoji-backup']
    });
    files.push(...matches);
  });
  
  // Remove duplicates
  const uniqueFiles = [...new Set(files)];
  
  console.log(`Found ${uniqueFiles.length} files to process`);
  console.log('');
  
  // Process each file
  uniqueFiles.forEach(file => {
    processFile(file);
  });
  
  // Print summary
  console.log('');
  console.log('=== REPLACEMENT SUMMARY ===');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log('');
  
  // Print replacement details
  if (Object.keys(replacementDetails).length > 0) {
    console.log('Replacement Details:');
    Object.entries(replacementDetails)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([emoji, details]) => {
        console.log(`  ${emoji} → ${details.to}: ${details.count} replacements in ${details.files.length} files`);
      });
  }
  
  console.log('');
  console.log('🏁 Emoji replacement complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run the validation script to verify all emojis are correct');
  console.log('2. Test the application to ensure functionality');
  console.log('3. Remove backup files once verified');
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.error('Error: glob package not found.');
  console.log('Installing glob...');
  const { execSync } = require('child_process');
  execSync('npm install glob', { stdio: 'inherit' });
  console.log('Glob installed. Please run the script again.');
}