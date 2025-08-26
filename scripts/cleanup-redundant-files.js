#!/usr/bin/env node

/**
 * BUMBA Repository Cleanup Script
 * Removes redundant, duplicate, and unnecessary files for posterity
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════╗');
console.log('║   BUMBA REPOSITORY CLEANUP SCRIPT      ║');
console.log('╚════════════════════════════════════════╝\n');

// Files to remove - identified as redundant
const REDUNDANT_FILES = {
  // Test files in root (should be in tests/ directory)
  rootTestFiles: [
    'test-100-percent-operability.js',
    'test-gemini.js',
    'test-git-orchestration-simple.js',
    'test-memory-context-system.js',
    'test-memory-enhancements.js'
  ],
  
  // Duplicate/obsolete status reports (keeping only the most recent/comprehensive)
  obsoleteReports: [
    '100_PERCENT_ACHIEVED.json', // Keeping COMPLETION_STATUS.json
    'AUDIT_REPORT.md', // Keeping BUMBA_COMPREHENSIVE_AUDIT_REPORT.md
    'FRAMEWORK_COMPLETION_PLAN.md', // Keeping FRAMEWORK_COMPLETION_FINAL_REPORT.md
    'SPRINT_2_COMPLETION_REPORT.md', // Sprint-specific, no longer needed
    'ROADMAP_TO_100_PERCENT.md', // Achieved 100%, no longer needed
    'MEMORY_SYSTEM_AUDIT_REPORT.md', // Integrated into comprehensive audit
    'GIT_ORCHESTRATION_TEST_REPORT.md', // Test report, no longer needed
    '100_PERCENT_CELEBRATION.md' // Celebration complete, no longer needed
  ],
  
  // Temporary development files
  temporaryFiles: [
    'bumba-api-logging-validation.md',
    'bumba-claude-default.md',
    'bumba-lite-mode-confirmation.md',
    'bumba-mcp-enhancement.md',
    'bumba-memory-context-management.md',
    'bumba-modes-complete.md',
    'HOOKS_ANALYSIS_AND_IMPROVEMENTS.md',
    'ROUTING_IMPROVEMENT_RECOMMENDATIONS.md',
    'QUALITY_IMPROVEMENTS_COMPLETED.md',
    'READY_FOR_TESTING.md',
    'PUBLIC_RELEASE_READY.md',
    'NAMING_CONVENTIONS.md'
  ],
  
  // Old deleted files (already marked for deletion in git)
  deletedFiles: [
    'DIAGNOSTICS_REPORT.md'
  ]
};

// Files to KEEP (important for the framework)
const KEEP_FILES = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'package.json',
  'package-lock.json',
  'bumba.config.js',
  'bumba-mcp-setup.json',
  '.env.example',
  'BUMBA_COMPREHENSIVE_AUDIT_REPORT.md',
  'FRAMEWORK_COMPLETION_FINAL_REPORT.md',
  'FINAL_OPERABILITY_STATUS.md',
  'COMPLETION_STATUS.json',
  'COMPREHENSIVE_SYSTEM_DOCUMENTATION.md',
  'BUMBA-MCP-SETUP-GUIDE.md',
  'BUMBA-MCP-Setup-Notion.md',
  'FRAMEWORK_HEALTH_REPORT.md',
  'OPERATIONAL_STATUS_REPORT.md',
  'OPENROUTER_INTEGRATION_SUMMARY.md',
  'RELEASE_NOTES_1.1.0.md',
  'REFERENCE.md',
  'bumba-prime.sh'
];

// Function to remove files safely
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

// Main cleanup function
function performCleanup() {
  const results = {
    removed: [],
    failed: [],
    kept: KEEP_FILES
  };
  
  console.log('🟢 Starting cleanup process...\n');
  
  // Process each category
  const allFiles = [
    ...REDUNDANT_FILES.rootTestFiles,
    ...REDUNDANT_FILES.obsoleteReports,
    ...REDUNDANT_FILES.temporaryFiles,
    ...REDUNDANT_FILES.deletedFiles
  ];
  
  allFiles.forEach(file => {
    const result = removeFile(file);
    if (result.success) {
      results.removed.push(file);
      console.log(`  🏁 Removed: ${file}`);
    } else if (result.reason !== 'File not found') {
      results.failed.push(result);
      console.log(`  🔴 Failed: ${file} - ${result.reason}`);
    }
  });
  
  // Clean up empty directories
  console.log('\n🟢 Checking for empty directories...');
  const emptyDirs = [
    'diagnostics',
    'test-repo',
    'src/tests' // Old test directory
  ];
  
  emptyDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          console.log(`  🏁 Removed empty directory: ${dir}`);
        }
      } catch (error) {
        console.log(`  🟡 Could not remove directory: ${dir}`);
      }
    }
  });
  
  return results;
}

// Generate cleanup report
function generateReport(results) {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         CLEANUP SUMMARY REPORT         ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`🟢 Statistics:`);
  console.log(`  • Files removed: ${results.removed.length}`);
  console.log(`  • Files failed: ${results.failed.length}`);
  console.log(`  • Important files kept: ${results.kept.length}\n`);
  
  if (results.removed.length > 0) {
    console.log('🟢️ Removed Files:');
    results.removed.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n🟡 Failed to Remove:');
    results.failed.forEach(item => {
      console.log(`  - ${item.file}: ${item.reason}`);
    });
  }
  
  console.log('\n🏁 Framework is now clean and organized!');
  console.log('   All redundant files have been removed.\n');
  
  // Save cleanup log
  const logContent = {
    timestamp: new Date().toISOString(),
    removed: results.removed,
    failed: results.failed,
    kept: results.kept
  };
  
  fs.writeFileSync('CLEANUP_LOG.json', JSON.stringify(logContent, null, 2));
  console.log('🟢 Cleanup log saved to CLEANUP_LOG.json\n');
}

// Execute cleanup with confirmation
console.log('🟡  This script will remove redundant files from the BUMBA repository.');
console.log('    Files to be removed include:');
console.log('    - Test files in root directory');
console.log('    - Duplicate status/audit reports');
console.log('    - Temporary development files');
console.log('    - Old sprint-specific reports\n');

console.log('🟢 Important files that will be KEPT:');
KEEP_FILES.slice(0, 10).forEach(file => {
  console.log(`    🏁 ${file}`);
});
console.log('    ... and more\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with cleanup? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const results = performCleanup();
    generateReport(results);
    
    console.log('🟢 Next Steps:');
    console.log('   1. Review CLEANUP_LOG.json for details');
    console.log('   2. Commit the cleanup changes');
    console.log('   3. Tag this as a clean release version\n');
  } else {
    console.log('\n🔴 Cleanup cancelled. No files were removed.\n');
  }
  
  rl.close();
  process.exit(0);
});