#!/usr/bin/env node

/**
 * Standardize Version to 2.0
 * Updates all version references across the framework to 2.0
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  // Core files
  { file: 'package.json', pattern: /"version": ".*?"/, replacement: '"version": "2.0"' },
  { file: 'install.js', pattern: /Framework v\d+\.\d+\.?\d*/, replacement: 'Framework v2.0' },
  { file: 'src/installer/index.js', pattern: /FRAMEWORK_VERSION = '\d+\.\d+\.?\d*'/, replacement: "FRAMEWORK_VERSION = '2.0'" },
  { file: 'src/installer/mcp-installer.js', pattern: /@version \d+\.\d+\.?\d*/, replacement: '@version 2.0' },
  { file: 'src/core/bumba-framework-2.js', pattern: /this\.version = '\d+\.\d+\.?\d*'/, replacement: "this.version = '2.0'" },
  { file: 'src/index.js', pattern: /Framework \d+\.\d+/, replacement: 'Framework 2.0' },
  
  // Documentation files
  { file: 'README.md', pattern: /version-\d+\.\d+\.?\d*-green/, replacement: 'version-2.0-green' },
  { file: 'BRAND.md', pattern: /Framework v\d+\.\d+\.?\d*/, replacement: 'Framework v2.0' },
  { file: 'BRAND.md', pattern: /Version: \d+\.\d+\.?\d*/, replacement: 'Version: 2.0' },
  { file: 'BRAND.md', pattern: /Document Version:.*?\d+\.\d+\.?\d*/, replacement: 'Document Version: 2.0' },
  { file: 'DOCUMENTATION_UPDATE_REPORT.md', pattern: /Documentation Version: \d+\.\d+\.?\d*/, replacement: 'Documentation Version: 2.0' },
  { file: 'COMPREHENSIVE_DOCS_AUDIT.md', pattern: /Documentation Version: \d+\.\d+\.?\d*/, replacement: 'Documentation Version: 2.0' },
  { file: 'SPRINT_3_COMPLETION_REPORT.md', pattern: /Framework Version: \d+\.\d+\.?\d*/, replacement: 'Framework Version: 2.0' },
  { file: 'OPERATIONAL_GUIDE.md', pattern: /Framework Version: \d+\.\d+/, replacement: 'Framework Version: 2.0' },
  { file: 'AGENTS.md', pattern: /Current Version: \d+\.\d+\.?\d*/, replacement: 'Current Version: 2.0' },
  { file: 'AGENTS.md', pattern: /Framework Version.*: \d+\.\d+\.?\d*/, replacement: 'Framework Version: 2.0' },
  { file: 'TEST_REPORT_UNIFICATION.md', pattern: /Framework Version:.*\d+\.\d+\.?\d*/, replacement: 'Framework Version: 2.0' },
  
  // Test files
  { file: 'tests/unification/integration.test.js', pattern: /version = '\d+\.\d+\.?\d*'/, replacement: "version = '2.0'" },
  { file: 'scripts/TEST_RESULTS_SPRINT1.md', pattern: /Version: \d+\.\d+\.?\d*/, replacement: 'Version: 2.0' },
  
  // Documentation in docs folder
  { file: 'docs/02-architecture/ARCHITECTURE.MD', pattern: /Framework v\d+\.\d+/, replacement: 'Framework v2.0' },
  { file: 'docs/01-getting-started/FRAMEWORK_GUIDE.MD', pattern: /Framework \d+\.\d+/, replacement: 'Framework 2.0' },
  { file: 'docs/01-getting-started/MIGRATION_GUIDE.MD', pattern: /"version": "\d+\.\d+\.?\d*"/, replacement: '"version": "2.0"' },
  { file: 'docs/01-getting-started/MIGRATION_GUIDE.MD', pattern: /Framework v\d+\.\d+/, replacement: 'Framework v2.0' },
  { file: 'docs/01-getting-started/MODEL_SETUP_GUIDE.MD', pattern: /BUMBA Version: \d+\.\d+/, replacement: 'BUMBA Version: 2.0' },
  { file: 'docs/10-archive/reports/ORCHESTRATION_AUDIT_REPORT.md', pattern: /Framework Version: \d+\.\d+\.?\d*/, replacement: 'Framework Version: 2.0' }
];

let updatedCount = 0;
let errors = [];

console.log('🟡 BUMBA Version Standardization to 2.0');
console.log('=========================================\n');

filesToUpdate.forEach(({ file, pattern, replacement }) => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Apply the replacement
      content = content.replace(pattern, replacement);
      
      // Check if anything changed
      if (content !== originalContent) {
        // Create backup
        fs.writeFileSync(filePath + '.version-backup', originalContent);
        // Write updated content
        fs.writeFileSync(filePath, content);
        console.log(`🏁 Updated: ${file}`);
        updatedCount++;
      } else {
        console.log(`   No changes needed: ${file}`);
      }
    } else {
      console.log(`   File not found: ${file}`);
    }
  } catch (error) {
    errors.push({ file, error: error.message });
    console.log(`🔴 Error updating ${file}: ${error.message}`);
  }
});

// Update package-lock.json separately (just the main version)
try {
  const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    let packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    
    // Update main version references
    if (packageLock.version !== '2.0') {
      packageLock.version = '2.0';
      if (packageLock.packages && packageLock.packages['']) {
        packageLock.packages[''].version = '2.0';
      }
      
      fs.writeFileSync(packageLockPath + '.version-backup', JSON.stringify(packageLock, null, 2));
      fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2));
      console.log('🏁 Updated: package-lock.json');
      updatedCount++;
    }
  }
} catch (error) {
  errors.push({ file: 'package-lock.json', error: error.message });
}

console.log('\n=========================================');
console.log('📊 Version Standardization Summary');
console.log('=========================================');
console.log(`Files Updated: ${updatedCount}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n🔴 Errors encountered:');
  errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n🏁 Version standardization complete!');
console.log('All version references have been updated to 2.0');

process.exit(errors.length > 0 ? 1 : 0);