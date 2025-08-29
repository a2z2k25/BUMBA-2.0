#!/usr/bin/env node

/**
 * BUMBA CLI Best Practices Cleanup Script
 * Reorganizes repository to follow framework development best practices
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  BUMBA BEST PRACTICES CLEANUP SCRIPT      ║');
console.log('╚════════════════════════════════════════════╝\n');

// Define proper structure according to best practices
const REORGANIZATION_PLAN = {
  // Root should only have essential files
  rootEssentials: [
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'CONTRIBUTING.md',
    'package.json',
    'package-lock.json',
    '.gitignore',
    '.npmignore',
    '.env.example'
  ],
  
  // Move reports to docs/reports/
  moveToDocsReports: [
    { from: 'AUDIT_REPORT.md', to: 'docs/reports/AUDIT_REPORT.md' },
    { from: 'BUMBA_COMPREHENSIVE_AUDIT_REPORT.md', to: 'docs/reports/COMPREHENSIVE_AUDIT.md' },
    { from: 'FRAMEWORK_COMPLETION_FINAL_REPORT.md', to: 'docs/reports/COMPLETION_REPORT.md' },
    { from: 'FRAMEWORK_HEALTH_REPORT.md', to: 'docs/reports/HEALTH_REPORT.md' },
    { from: 'OPERATIONAL_STATUS_REPORT.md', to: 'docs/reports/OPERATIONAL_STATUS.md' },
    { from: 'MEMORY_SYSTEM_AUDIT_REPORT.md', to: 'docs/reports/MEMORY_AUDIT.md' },
    { from: 'GIT_ORCHESTRATION_TEST_REPORT.md', to: 'docs/reports/GIT_ORCHESTRATION.md' },
    { from: 'FINAL_OPERABILITY_STATUS.md', to: 'docs/reports/FINAL_STATUS.md' }
  ],
  
  // Move guides to docs/guides/
  moveToDocsGuides: [
    { from: 'BUMBA-MCP-SETUP-GUIDE.md', to: 'docs/guides/MCP_SETUP.md' },
    { from: 'BUMBA-MCP-Setup-Notion.md', to: 'docs/guides/MCP_NOTION_SETUP.md' },
    { from: 'COMPREHENSIVE_SYSTEM_DOCUMENTATION.md', to: 'docs/guides/SYSTEM_DOCUMENTATION.md' },
    { from: 'OPENROUTER_INTEGRATION_SUMMARY.md', to: 'docs/guides/OPENROUTER_INTEGRATION.md' }
  ],
  
  // Move to config directory
  moveToConfig: [
    { from: 'bumba.config.js', to: 'config/bumba.config.js' },
    { from: 'bumba-mcp-setup.json', to: 'config/mcp-setup.json' },
    { from: 'jest.config.js', to: 'config/jest.config.js' },
    { from: 'jest.integration.config.js', to: 'config/jest.integration.js' },
    { from: 'eslint.config.js', to: 'config/eslint.config.js' },
    { from: 'webpack.config.js', to: 'config/webpack.config.js' },
    { from: 'tsconfig.json', to: 'config/tsconfig.json' },
    { from: 'jsdoc.config.json', to: 'config/jsdoc.json' }
  ],
  
  // Files to remove (redundant or temporary)
  filesToRemove: [
    // Test files in root
    'test-100-percent-operability.js',
    'test-gemini.js',
    'test-git-orchestration-simple.js',
    'test-memory-context-system.js',
    'test-memory-enhancements.js',
    
    // Temporary working files
    'bumba-api-logging-validation.md',
    'bumba-claude-default.md',
    'bumba-lite-mode-confirmation.md',
    'bumba-mcp-enhancement.md',
    'bumba-memory-context-management.md',
    'bumba-modes-complete.md',
    
    // Celebration/status files
    '100_PERCENT_ACHIEVED.json',
    '100_PERCENT_CELEBRATION.md',
    'COMPLETION_STATUS.json',
    'FRAMEWORK_COMPLETION_PLAN.md',
    'SPRINT_2_COMPLETION_REPORT.md',
    'ROADMAP_TO_100_PERCENT.md',
    
    // Old recommendations
    'HOOKS_ANALYSIS_AND_IMPROVEMENTS.md',
    'ROUTING_IMPROVEMENT_RECOMMENDATIONS.md',
    'QUALITY_IMPROVEMENTS_COMPLETED.md',
    'READY_FOR_TESTING.md',
    'PUBLIC_RELEASE_READY.md',
    'NAMING_CONVENTIONS.md',
    'REFERENCE.md',
    'DIAGNOSTICS_REPORT.md'
  ],
  
  // Directories to remove if empty
  emptyDirsToRemove: [
    'diagnostics',
    'test-repo',
    'src/tests',
    'tests/fixtures',
    '.bumba/knowledge',
    'src/types',
    'src/templates/hooks'
  ],
  
  // Log files to gitignore
  addToGitignore: [
    'bumba-logs/',
    '*.log',
    'CLEANUP_LOG.json',
    'dist/',
    '.bumba-usage.json'
  ]
};

// Helper functions
function ensureDirectoryExists(dirPath) {
  const fullPath = path.dirname(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  🟢 Created directory: ${fullPath}`);
  }
}

function moveFile(from, to) {
  try {
    if (fs.existsSync(from)) {
      ensureDirectoryExists(to);
      const content = fs.readFileSync(from);
      fs.writeFileSync(to, content);
      fs.unlinkSync(from);
      return { success: true, from, to };
    }
    return { success: false, from, to, reason: 'Source file not found' };
  } catch (error) {
    return { success: false, from, to, reason: error.message };
  }
}

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, file: filePath };
    }
    return { success: false, file: filePath, reason: 'File not found' };
  } catch (error) {
    return { success: false, file: filePath, reason: error.message };
  }
}

function removeEmptyDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        return { success: true, dir: dirPath };
      }
      return { success: false, dir: dirPath, reason: 'Directory not empty' };
    }
    return { success: false, dir: dirPath, reason: 'Directory not found' };
  } catch (error) {
    return { success: false, dir: dirPath, reason: error.message };
  }
}

function updateGitignore() {
  const gitignorePath = '.gitignore';
  let content = '';
  
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  const additions = [];
  REORGANIZATION_PLAN.addToGitignore.forEach(pattern => {
    if (!content.includes(pattern)) {
      additions.push(pattern);
    }
  });
  
  if (additions.length > 0) {
    content += '\n# Best practices cleanup additions\n' + additions.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, content);
    return additions;
  }
  
  return [];
}

function updatePackageJsonPaths() {
  const packagePath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update config paths
  if (pkg.jest) {
    delete pkg.jest; // Will use config/jest.config.js
  }
  
  // Update scripts to use new config paths
  if (pkg.scripts) {
    if (pkg.scripts.test) {
      pkg.scripts.test = pkg.scripts.test.replace('jest.config.js', 'config/jest.config.js');
    }
    if (pkg.scripts.lint) {
      pkg.scripts.lint = pkg.scripts.lint.replace('eslint.config.js', 'config/eslint.config.js');
    }
    if (pkg.scripts.build) {
      pkg.scripts.build = pkg.scripts.build.replace('webpack.config.js', 'config/webpack.config.js');
    }
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  return true;
}

// Main cleanup function
function performCleanup() {
  const results = {
    moved: [],
    removed: [],
    failed: [],
    gitignoreUpdated: [],
    directoriesRemoved: []
  };
  
  console.log('🟢 Starting best practices cleanup...\n');
  
  // Step 1: Move reports to docs/reports/
  console.log('🟢 Moving reports to docs/reports/...');
  REORGANIZATION_PLAN.moveToDocsReports.forEach(item => {
    const result = moveFile(item.from, item.to);
    if (result.success) {
      results.moved.push(result);
      console.log(`  🏁 Moved: ${item.from} → ${item.to}`);
    } else if (result.reason !== 'Source file not found') {
      results.failed.push(result);
      console.log(`  🔴 Failed: ${item.from} - ${result.reason}`);
    }
  });
  
  // Step 2: Move guides to docs/guides/
  console.log('\n🟢 Moving guides to docs/guides/...');
  REORGANIZATION_PLAN.moveToDocsGuides.forEach(item => {
    const result = moveFile(item.from, item.to);
    if (result.success) {
      results.moved.push(result);
      console.log(`  🏁 Moved: ${item.from} → ${item.to}`);
    } else if (result.reason !== 'Source file not found') {
      results.failed.push(result);
      console.log(`  🔴 Failed: ${item.from} - ${result.reason}`);
    }
  });
  
  // Step 3: Move config files to config/
  console.log('\n🟢 Moving configuration files to config/...');
  REORGANIZATION_PLAN.moveToConfig.forEach(item => {
    const result = moveFile(item.from, item.to);
    if (result.success) {
      results.moved.push(result);
      console.log(`  🏁 Moved: ${item.from} → ${item.to}`);
    } else if (result.reason !== 'Source file not found') {
      results.failed.push(result);
      console.log(`  🔴 Failed: ${item.from} - ${result.reason}`);
    }
  });
  
  // Step 4: Remove redundant files
  console.log('\n🟢️ Removing redundant files...');
  REORGANIZATION_PLAN.filesToRemove.forEach(file => {
    const result = removeFile(file);
    if (result.success) {
      results.removed.push(file);
      console.log(`  🏁 Removed: ${file}`);
    } else if (result.reason !== 'File not found') {
      results.failed.push(result);
      console.log(`  🔴 Failed: ${file} - ${result.reason}`);
    }
  });
  
  // Step 5: Remove empty directories
  console.log('\n🟢 Removing empty directories...');
  REORGANIZATION_PLAN.emptyDirsToRemove.forEach(dir => {
    const result = removeEmptyDirectory(dir);
    if (result.success) {
      results.directoriesRemoved.push(dir);
      console.log(`  🏁 Removed empty directory: ${dir}`);
    }
  });
  
  // Step 6: Update .gitignore
  console.log('\n🟢 Updating .gitignore...');
  const gitignoreAdditions = updateGitignore();
  results.gitignoreUpdated = gitignoreAdditions;
  if (gitignoreAdditions.length > 0) {
    gitignoreAdditions.forEach(pattern => {
      console.log(`  🏁 Added to .gitignore: ${pattern}`);
    });
  }
  
  // Step 7: Update package.json paths
  console.log('\n🟢 Updating package.json configuration paths...');
  if (updatePackageJsonPaths()) {
    console.log('  🏁 Updated package.json with new config paths');
  }
  
  return results;
}

// Generate final report
function generateReport(results) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     BEST PRACTICES CLEANUP COMPLETE       ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log('🟢 Cleanup Statistics:');
  console.log(`  • Files moved: ${results.moved.length}`);
  console.log(`  • Files removed: ${results.removed.length}`);
  console.log(`  • Directories removed: ${results.directoriesRemoved.length}`);
  console.log(`  • Gitignore entries added: ${results.gitignoreUpdated.length}`);
  console.log(`  • Failed operations: ${results.failed.length}\n`);
  
  console.log('🏁 Repository Structure Improvements:');
  console.log('  🏁 Root directory cleaned (only essential files)');
  console.log('  🏁 Documentation organized in docs/');
  console.log('  🏁 Configuration files moved to config/');
  console.log('  🏁 Temporary files removed');
  console.log('  🏁 Empty directories cleaned up');
  console.log('  🏁 .gitignore updated with best practices\n');
  
  // Save cleanup log
  const logContent = {
    timestamp: new Date().toISOString(),
    moved: results.moved,
    removed: results.removed,
    directoriesRemoved: results.directoriesRemoved,
    gitignoreUpdated: results.gitignoreUpdated,
    failed: results.failed
  };
  
  fs.writeFileSync('BEST_PRACTICES_CLEANUP_LOG.json', JSON.stringify(logContent, null, 2));
  console.log('🟢 Cleanup log saved to BEST_PRACTICES_CLEANUP_LOG.json\n');
}

// Execute with confirmation
console.log('🟡  This script will reorganize the BUMBA repository to follow best practices:\n');
console.log('  Actions to be performed:');
console.log('  • Move 12+ documentation files to docs/');
console.log('  • Move 8 config files to config/');
console.log('  • Remove 30+ redundant files');
console.log('  • Clean up empty directories');
console.log('  • Update .gitignore');
console.log('  • Update package.json paths\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with best practices cleanup? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const results = performCleanup();
    generateReport(results);
    
    console.log('🟢 Next Steps:');
    console.log('   1. Test the framework: npm test');
    console.log('   2. Verify build: npm run build');
    console.log('   3. Commit changes: git commit -m "refactor: Reorganize to follow best practices"');
    console.log('   4. Tag release: git tag v1.0.0-clean\n');
  } else {
    console.log('\n🔴 Cleanup cancelled. No changes were made.\n');
  }
  
  rl.close();
  process.exit(0);
});