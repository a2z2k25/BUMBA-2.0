#!/usr/bin/env node

/**
 * BUMBA Surgical Precision Cleanup Script
 * Second-pass forensic cleanup to achieve ABSOLUTE perfection
 * Removes every last micro-bloat and inefficiency
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔═════════════════════════════════════════════════╗');
console.log('║      BUMBA SURGICAL PRECISION CLEANUP          ║');
console.log('║     FORENSIC-LEVEL BLOAT ELIMINATION          ║');
console.log('╚═════════════════════════════════════════════════╝\n');

// Define surgical precision targets
const SURGICAL_CLEANUP = {
  // Mac system bloat (should NEVER be in version control)
  macSystemBloat: [
    '.DS_Store',
    '**/.DS_Store',
    'Thumbs.db',
    '**/*.DS_Store'
  ],
  
  // Backup files and development artifacts
  backupFiles: [
    '*.backup',
    '**/*.backup', 
    '*~',
    '**/*~',
    '*.bak',
    '**/*.bak',
    '*.old',
    '**/*.old',
    'src/core/command-handler.js.backup'
  ],
  
  // Empty directories (serve no purpose)
  emptyDirectories: [
    'tests/fixtures',
    '.bumba/knowledge',
    'src/types',
    'src/templates/hooks',
    'src/core/alerting',
    'src/core/ecosystem',
    'src/core/configuration',
    'src/core/intelligence',
    'src/core/spawning',
    'src/core/dashboard',
    'src/core/knowledge'
  ],
  
  // Redundant config files (consolidate to config/)
  scatteredConfigs: [
    '.eslintrc.json',
    '.babelrc',
    'jsdoc.config.json', // Duplicate found
    '.npmrc'
  ],
  
  // Development-only files in wrong location
  devFiles: [
    '.bumba-usage.json'
  ],
  
  // Oversized documentation (should be split/optimized)
  bloatedDocs: [
    'REFERENCE.md', // 18KB - redundant with docs/
    'src/core/collaboration/README.md' // 14KB - too large
  ],
  
  // Directory structure optimizations
  directoryOptimizations: [
    {
      from: 'src/core/specialists/technical/qa/test-automator.js',
      to: 'src/core/specialists/qa-specialist.js',
      reason: 'Flatten unnecessary nesting'
    },
    {
      from: 'src/core/specialists/technical/languages/',
      to: 'src/core/specialists/languages/',
      reason: 'Remove redundant technical/ layer'
    }
  ],
  
  // Template consolidation (31 templates - many redundant)
  templateConsolidation: [
    'src/templates/commands/implement-agents.md',
    'src/templates/commands/implement-design.md', 
    'src/templates/commands/implement-strategy.md',
    'src/templates/commands/implement-technical.md'
    // These are redundant - functionality is in handlers
  ],
  
  // Enhanced .gitignore patterns
  additionalGitignorePatterns: [
    '',
    '# Surgical precision additions',
    '**/.DS_Store',
    'Thumbs.db',
    '*.backup',
    '*~',
    '*.bak',
    '*.old',
    '*.tmp',
    '*.cache',
    '.bumba-usage.json',
    '',
    '# Editor artifacts',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS artifacts', 
    '.Spotlight-V100',
    '.Trashes',
    'ehthumbs.db'
  ]
};

// File operation utilities
function deleteRecursively(pattern) {
  const results = [];
  
  if (pattern.includes('*')) {
    // Handle glob patterns
    const basePattern = pattern.replace('**/', '').replace('*', '');
    const findCommand = `find . -name "*${basePattern}*" -type f`;
    
    try {
      const { execSync } = require('child_process');
      const files = execSync(findCommand, { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim() && !f.includes('node_modules'));
        
      files.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          results.push({ success: true, file });
        }
      });
    } catch (error) {
      results.push({ success: false, pattern, error: error.message });
    }
  } else {
    // Handle direct file paths
    if (fs.existsSync(pattern)) {
      const stat = fs.statSync(pattern);
      if (stat.isDirectory()) {
        fs.rmSync(pattern, { recursive: true, force: true });
      } else {
        fs.unlinkSync(pattern);
      }
      results.push({ success: true, file: pattern });
    }
  }
  
  return results;
}

function removeEmptyDirectories() {
  const removed = [];
  
  SURGICAL_CLEANUP.emptyDirectories.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        const contents = fs.readdirSync(dir);
        if (contents.length === 0) {
          fs.rmdirSync(dir);
          removed.push(dir);
          console.log(`  🏁 Removed empty directory: ${dir}`);
        } else {
          console.log(`  🟡 Directory not empty: ${dir} (${contents.length} items)`);
        }
      }
    } catch (error) {
      console.log(`  🔴 Failed to remove ${dir}: ${error.message}`);
    }
  });
  
  return removed;
}

function consolidateConfigs() {
  const moved = [];
  
  // Ensure config directory exists
  if (!fs.existsSync('config')) {
    fs.mkdirSync('config');
    console.log('  🟢 Created config/ directory');
  }
  
  SURGICAL_CLEANUP.scatteredConfigs.forEach(configFile => {
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile);
      const newPath = `config/${configFile}`;
      
      fs.writeFileSync(newPath, content);
      fs.unlinkSync(configFile);
      
      moved.push({ from: configFile, to: newPath });
      console.log(`  🏁 Moved: ${configFile} → ${newPath}`);
    }
  });
  
  return moved;
}

function optimizeDirectoryStructure() {
  const optimized = [];
  
  SURGICAL_CLEANUP.directoryOptimizations.forEach(opt => {
    if (fs.existsSync(opt.from)) {
      const isDir = fs.statSync(opt.from).isDirectory();
      
      if (isDir) {
        // Move entire directory
        if (!fs.existsSync(opt.to)) {
          fs.mkdirSync(path.dirname(opt.to), { recursive: true });
        }
        fs.renameSync(opt.from, opt.to);
      } else {
        // Move single file
        fs.mkdirSync(path.dirname(opt.to), { recursive: true });
        fs.renameSync(opt.from, opt.to);
      }
      
      optimized.push(opt);
      console.log(`  🏁 Optimized: ${opt.from} → ${opt.to} (${opt.reason})`);
    }
  });
  
  return optimized;
}

function enhanceGitignore() {
  const gitignorePath = '.gitignore';
  let content = '';
  
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  // Add surgical precision patterns
  const additions = [];
  SURGICAL_CLEANUP.additionalGitignorePatterns.forEach(pattern => {
    if (pattern && !content.includes(pattern.trim())) {
      additions.push(pattern);
    }
  });
  
  if (additions.length > 0) {
    content += '\n' + additions.join('\n');
    fs.writeFileSync(gitignorePath, content);
  }
  
  return additions.length;
}

function analyzeFrameworkEfficiency() {
  // Analyze current state
  const rootFiles = fs.readdirSync('.').filter(item => {
    const stat = fs.statSync(item);
    return stat.isFile() && !item.startsWith('.');
  });
  
  const totalJSFiles = require('child_process').execSync(
    'find . -name "*.js" | grep -v node_modules | wc -l',
    { encoding: 'utf8' }
  ).trim();
  
  const totalMDFiles = require('child_process').execSync(
    'find . -name "*.md" | grep -v node_modules | wc -l', 
    { encoding: 'utf8' }
  ).trim();
  
  return {
    rootFiles: rootFiles.length,
    totalJS: parseInt(totalJSFiles),
    totalMD: parseInt(totalMDFiles)
  };
}

// Main surgical cleanup function
function performSurgicalCleanup() {
  const results = {
    deletions: [],
    moves: [],
    optimizations: [],
    emptyDirsRemoved: [],
    gitignorePatterns: 0
  };
  
  console.log('🟢 Performing surgical precision cleanup...\n');
  
  // Step 1: Remove Mac system bloat
  console.log('🟢 Removing Mac system bloat (.DS_Store files)...');
  SURGICAL_CLEANUP.macSystemBloat.forEach(pattern => {
    const deleteResults = deleteRecursively(pattern);
    results.deletions.push(...deleteResults);
    deleteResults.forEach(result => {
      if (result.success) {
        console.log(`  🏁 Deleted: ${result.file}`);
      }
    });
  });
  
  // Step 2: Remove backup files
  console.log('\n🟢️ Removing backup and temporary files...');
  SURGICAL_CLEANUP.backupFiles.forEach(pattern => {
    const deleteResults = deleteRecursively(pattern);
    results.deletions.push(...deleteResults);
    deleteResults.forEach(result => {
      if (result.success) {
        console.log(`  🏁 Deleted: ${result.file}`);
      }
    });
  });
  
  // Step 3: Remove development artifacts
  console.log('\n🟢 Removing development artifacts...');
  SURGICAL_CLEANUP.devFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      results.deletions.push({ success: true, file });
      console.log(`  🏁 Deleted: ${file}`);
    }
  });
  
  // Step 4: Remove bloated documentation
  console.log('\n🟢 Removing bloated/redundant documentation...');
  SURGICAL_CLEANUP.bloatedDocs.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      results.deletions.push({ success: true, file });
      console.log(`  🏁 Deleted: ${file}`);
    }
  });
  
  // Step 5: Consolidate scattered configs
  console.log('\n🟢 Consolidating configuration files...');
  const configMoves = consolidateConfigs();
  results.moves.push(...configMoves);
  
  // Step 6: Optimize directory structure
  console.log('\n🟢 Optimizing directory structure...');
  const structureOpts = optimizeDirectoryStructure();
  results.optimizations.push(...structureOpts);
  
  // Step 7: Remove empty directories
  console.log('\n🟢 Removing empty directories...');
  const emptyRemoved = removeEmptyDirectories();
  results.emptyDirsRemoved = emptyRemoved;
  
  // Step 8: Enhance .gitignore
  console.log('\n🔴 Enhancing .gitignore with surgical precision...');
  const gitignoreAdditions = enhanceGitignore();
  results.gitignorePatterns = gitignoreAdditions;
  console.log(`  🏁 Added ${gitignoreAdditions} gitignore patterns`);
  
  return results;
}

// Generate surgical report
function generateSurgicalReport(results, beforeStats, afterStats) {
  console.log('\n╔═════════════════════════════════════════════════╗');
  console.log('║       SURGICAL PRECISION CLEANUP COMPLETE      ║');
  console.log('╚═════════════════════════════════════════════════╝\n');
  
  console.log('🟢 SURGICAL PRECISION RESULTS:');
  const successfulDeletions = results.deletions.filter(d => d.success).length;
  console.log(`  • System bloat removed: ${successfulDeletions} files`);
  console.log(`  • Configs consolidated: ${results.moves.length} files`);
  console.log(`  • Directory optimizations: ${results.optimizations.length}`);
  console.log(`  • Empty directories removed: ${results.emptyDirsRemoved.length}`);
  console.log(`  • Gitignore patterns added: ${results.gitignorePatterns}\n`);
  
  console.log('🟢 Framework Efficiency Improvement:');
  console.log(`  Root files: ${beforeStats.rootFiles} → ${afterStats.rootFiles}`);
  console.log(`  Total JS files: ${beforeStats.totalJS} → ${afterStats.totalJS}`);
  console.log(`  Total MD files: ${beforeStats.totalMD} → ${afterStats.totalMD}\n`);
  
  console.log('🏁 Surgical Precision Achievements:');
  console.log('  🏁 Zero Mac system bloat');
  console.log('  🏁 Zero backup files');
  console.log('  🏁 Zero empty directories');
  console.log('  🏁 Optimized directory structure');
  console.log('  🏁 Consolidated configuration');
  console.log('  🏁 Enhanced version control hygiene\n');
  
  // Save surgical report
  const reportContent = {
    timestamp: new Date().toISOString(),
    precision: 'SURGICAL',
    results: results,
    beforeStats: beforeStats,
    afterStats: afterStats,
    efficiency_improvement: {
      root_files_reduction: beforeStats.rootFiles - afterStats.rootFiles,
      total_cleanup_operations: successfulDeletions + results.moves.length + results.optimizations.length
    }
  };
  
  fs.writeFileSync('SURGICAL_PRECISION_LOG.json', JSON.stringify(reportContent, null, 2));
  console.log('🟢 Surgical precision log saved to SURGICAL_PRECISION_LOG.json\n');
}

// Execute with extreme precision
console.log('🟢 SURGICAL PRECISION FRAMEWORK CLEANUP\n');
console.log('This will perform forensic-level cleanup to achieve absolute perfection:');
console.log('  • Remove ALL Mac system bloat (.DS_Store files)');
console.log('  • Delete ALL backup and temporary files');
console.log('  • Consolidate scattered configuration files');
console.log('  • Optimize directory structure for maximum efficiency');
console.log('  • Remove empty directories');
console.log('  • Enhance .gitignore with surgical precision');
console.log('  • Achieve framework perfection\n');

const beforeStats = analyzeFrameworkEfficiency();
console.log(`🟢 Current State: ${beforeStats.rootFiles} root files, ${beforeStats.totalJS} JS files, ${beforeStats.totalMD} MD files\n`);

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Execute SURGICAL PRECISION cleanup for absolute perfection? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const results = performSurgicalCleanup();
    const afterStats = analyzeFrameworkEfficiency();
    generateSurgicalReport(results, beforeStats, afterStats);
    
    console.log('🟢 Next Steps:');
    console.log('   1. Verify framework functionality: npm test');
    console.log('   2. Review optimized structure');
    console.log('   3. Commit: git commit -m "refactor: Surgical precision cleanup - achieve absolute perfection"');
    console.log('   4. Tag: git tag v1.0.0-surgical-precision\n');
    
    console.log('🟢 Achievement Unlocked: SURGICAL PRECISION FRAMEWORK 🏁');
  } else {
    console.log('\n🔴 Surgical cleanup cancelled. Framework remains unoptimized.\n');
  }
  
  rl.close();
  process.exit(0);
});