#!/usr/bin/env node

/**
 * Fix Remaining Emoji Violations
 * Targets all remaining files with unauthorized emojis
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive replacement map
const replacements = {
  '✅': '🏁',
  '✓': '🏁',
  '❌': '🔴',
  '✗': '🔴',
  '❓': '🟡',
  '⚠️': '🟠',
  '⚠': '🟠',
  '⚡': '🟢',
  '🚀': '🟢',
  '🎯': '🟡',
  '🚨': '🔴',
  '⚙️': '🟢',
  '⚙': '🟢',
  '🎉': '🏁',
  '🎊': '🏁',
  '🎨': '🔴',
  '✨': '🟡',
  '🌟': '🟡',
  '🏆': '🏁',
  '🛑': '🔴',
  '🛡️': '🟡',
  '🛡': '🟡',
  '🏥': '🟢',
  '🎭': '🔴',
  '🌐': '🟢',
  '🏗️': '🟢',
  '🏗': '🟢',
  '⚖️': '🟡',
  '⚖': '🟡',
  '🎼': '🔴',
  '🎺': '🔴',
  '🎮': '🔴',
  '🏢': '🟢',
  '🎬': '🔴',
  '🎛️': '🟢',
  '🎛': '🟢',
  '🎵': '🔴',
  '🚦': '🟠',
  '🚧': '🟠',
  '🚫': '🔴',
  '🛠️': '🟢',
  '🛠': '🟢',
  '♻️': '🟢',
  '♿': '🟠',
  '🏃': '🟢',
  '🏊': '🟢',
  '🏭': '🟢',
  '🌉': '🟢',
  '🌍': '🟢',
  '🏛️': '🟢',
  '🏛': '🟢',
  // Face emojis - remove entirely
  '😀': '',
  '😃': '',
  '😄': '',
  '😊': '',
  '😔': '',
  '😖': '',
  '😠': '',
  '😡': '',
  '😢': '',
  '😨': '',
  '😭': '',
  '😮': '',
  '😰': '',
  '😱': '',
  '😲': '',
  '🙏': ''
};

let filesProcessed = 0;
let filesModified = 0;
let totalReplacements = 0;

function processFile(filePath) {
  try {
    // Skip backup files
    if (filePath.includes('.backup') || filePath.includes('.emoji-backup')) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;

    // Apply replacements
    for (const [oldEmoji, newEmoji] of Object.entries(replacements)) {
      if (content.includes(oldEmoji)) {
        const regex = new RegExp(oldEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        
        if (count > 0) {
          content = content.replace(regex, newEmoji);
          fileReplacements += count;
        }
      }
    }

    // If content changed, write it back
    if (content !== originalContent) {
      // Create backup first
      const backupPath = filePath + '.emoji-backup';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }
      
      // Write modified content
      fs.writeFileSync(filePath, content, 'utf8');
      
      filesModified++;
      totalReplacements += fileReplacements;
      
      console.log(`🏁 Fixed ${filePath} (${fileReplacements} replacements)`);
    }
    
    filesProcessed++;
  } catch (error) {
    console.error(`🔴 Error processing ${filePath}: ${error.message}`);
  }
}

// Main execution
console.log('=== Fixing Remaining Emoji Violations ===');
console.log('');

// Target specific directories with violations
const targetPaths = [
  'src/core/pooling-v2/**/*.md',
  'src/core/lite-mode/**/*.md',
  'archived/**/*.js',
  'scripts/**/*.md',
  'src/core/notion/**/*.md',
  '*.js',  // Root level test files
  'test-*.js'
];

const files = [];
targetPaths.forEach(pattern => {
  const matches = glob.sync(pattern, {
    ignore: ['**/node_modules/**', '**/*.backup', '**/*.emoji-backup']
  });
  files.push(...matches);
});

// Remove duplicates
const uniqueFiles = [...new Set(files)];

console.log(`Found ${uniqueFiles.length} files to check`);
console.log('');

// Process each file
uniqueFiles.forEach(file => {
  processFile(file);
});

console.log('');
console.log('=== SUMMARY ===');
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('');

if (filesModified > 0) {
  console.log('🏁 Remaining violations fixed!');
  console.log('Run verification script to confirm all violations are resolved.');
} else {
  console.log('No violations found in target files.');
}

// Check if glob is installed
if (!require.resolve('glob')) {
  console.error('Installing glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
}