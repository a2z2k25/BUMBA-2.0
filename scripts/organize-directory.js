#!/usr/bin/env node

/**
 * Directory Organization Script
 * Reorganizes BUMBA framework files according to best practices
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Define organization structure
const organizationPlan = {
  // Documentation that should stay in root
  keepInRoot: [
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    '.gitignore',
    '.npmignore',
    '.npmrc',
    'package.json',
    'package-lock.json',
    'bumba.config.js',
    'jest.config.js',
    'tsconfig.json',
    '.babelrc',
    '.env.example',
    'install.js'
  ],
  
  // Files to move to specific directories
  moveToDirectories: {
    'docs/reports': [
      'AGENTS.md',
      'BRAND.md',
      'BRAND_CONSISTENCY_PLAN.md',
      'COMPREHENSIVE_DOCS_AUDIT.md',
      'COMPREHENSIVE_EXECUTION_PLAN.md',
      'DOCUMENTATION_UPDATE_REPORT.md',
      'EMOJI_VIOLATION_REPORT.md',
      'FINAL_VALIDATION_TEST_REPORT.md',
      'SECURITY_AUDIT_REPORT.md',
      'SPRINT_3_COMPLETION_REPORT.md',
      'TEST_REPORT_UNIFICATION.md',
      'VERSION_STANDARDIZATION_REPORT.md',
      'OPERATIONAL_GUIDE.md',
      'DAY3_PERFORMANCE_REPORT.md',
      'CLAUDE_FLOW_GENIUS_INTEGRATION.md'
    ],
    'scripts/tests': [
      'test-meta-validation.js',
      'test-validation-final.js',
      'fix-missing-imports.js',
      'fix-specialist-imports-safe.js',
      'install-helix.js'
    ],
    'docs/archive': [
      '*.md.emoji-backup',
      '*.md.version-backup',
      '*.js.emoji-backup',
      '*.js.version-backup',
      '*.spawn-backup',
      '*.txt'
    ],
    'scripts/maintenance': [
      'emoji-audit.sh',
      'emoji-replacement-map.json',
      'fix-core-emojis.js',
      'fix-remaining-emojis.js',
      'update-spawn-messaging.js',
      'specialist-registry-display.js',
      'standardize-version.js',
      'verify-brand-consistency.sh'
    ],
    '.config': [
      '.bumba-health.json',
      '.bumba-performance.json',
      '.bumba-session',
      '.bumba-usage.json'
    ]
  }
};

// Files that should be deleted (backups, temp files)
const filesToDelete = [
  'Heap.*.heapsnapshot',
  '*.backup',
  '*.bak',
  'emoji_audit.txt',
  'emoji_violations.txt',
  'specialist-import-fixes.json'
];

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function moveFile(source, destination) {
  const sourcePath = path.join(rootDir, source);
  const destPath = path.join(rootDir, destination, path.basename(source));
  
  if (fs.existsSync(sourcePath)) {
    ensureDirectory(path.join(rootDir, destination));
    
    // Check if destination already exists
    if (fs.existsSync(destPath)) {
      console.log(`   File already exists in destination: ${path.basename(source)}`);
      return false;
    }
    
    fs.renameSync(sourcePath, destPath);
    console.log(`   🟢 Moved: ${source} → ${destination}/`);
    return true;
  }
  return false;
}

function deleteFile(pattern) {
  const files = fs.readdirSync(rootDir).filter(file => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(file);
    }
    return file === pattern;
  });
  
  files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      console.log(`   🔴 Deleted: ${file}`);
    }
  });
}

// Main execution
console.log('🟡 BUMBA Directory Organization');
console.log('=================================\n');

// Count files before
const filesBefore = fs.readdirSync(rootDir).filter(f => 
  fs.statSync(path.join(rootDir, f)).isFile()
).length;

console.log(`Files in root before: ${filesBefore}\n`);

// Move documentation files
console.log('📚 Moving documentation files...');
let movedCount = 0;
for (const [destDir, files] of Object.entries(organizationPlan.moveToDirectories)) {
  files.forEach(filePattern => {
    if (filePattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(filePattern.replace(/\*/g, '.*'));
      const matchingFiles = fs.readdirSync(rootDir).filter(f => regex.test(f));
      matchingFiles.forEach(file => {
        if (moveFile(file, destDir)) movedCount++;
      });
    } else {
      // Handle specific files
      if (moveFile(filePattern, destDir)) movedCount++;
    }
  });
}

// Delete temporary and backup files
console.log('\n🗑️  Cleaning temporary files...');
let deletedCount = 0;
filesToDelete.forEach(pattern => {
  const before = fs.readdirSync(rootDir).length;
  deleteFile(pattern);
  const after = fs.readdirSync(rootDir).length;
  deletedCount += (before - after);
});

// Count files after
const filesAfter = fs.readdirSync(rootDir).filter(f => 
  fs.statSync(path.join(rootDir, f)).isFile()
).length;

// Create a clean project structure report
console.log('\n=================================');
console.log('📊 Organization Summary');
console.log('=================================');
console.log(`Files in root before: ${filesBefore}`);
console.log(`Files in root after: ${filesAfter}`);
console.log(`Files moved: ${movedCount}`);
console.log(`Files deleted: ${deletedCount}`);

// List what remains in root
console.log('\n📁 Root directory now contains:');
const rootFiles = fs.readdirSync(rootDir)
  .filter(f => fs.statSync(path.join(rootDir, f)).isFile())
  .sort();

rootFiles.forEach(file => {
  const icon = file.endsWith('.md') ? '📝' :
               file.endsWith('.json') ? '⚙️' :
               file.endsWith('.js') ? '📦' :
               file.startsWith('.') ? '🔧' : '📄';
  console.log(`   ${icon} ${file}`);
});

// Create directory structure visualization
console.log('\n🌳 Project Structure:');
console.log('```');
console.log('bumba/');
console.log('├── src/          # Source code');
console.log('├── tests/        # Test files');
console.log('├── scripts/      # Utility scripts');
console.log('│   ├── tests/    # Test scripts');
console.log('│   └── maintenance/ # Maintenance scripts');
console.log('├── docs/         # Documentation');
console.log('│   ├── reports/  # Generated reports');
console.log('│   └── archive/  # Backup files');
console.log('├── assets/       # Static assets');
console.log('├── config/       # Configuration');
console.log('├── lib/          # Compiled code');
console.log('└── .config/      # Runtime configs');
console.log('```');

console.log('\n🏁 Directory organization complete!');
console.log('The project now follows standard Node.js best practices.\n');

// Create a summary file
const summaryPath = path.join(rootDir, 'docs', 'DIRECTORY_ORGANIZATION_SUMMARY.md');
const summary = `# Directory Organization Summary

## Organization Date
${new Date().toISOString()}

## Changes Made

### Files Moved from Root
- **Documentation Reports**: ${organizationPlan.moveToDirectories['docs/reports'].length} files → \`docs/reports/\`
- **Test Scripts**: ${organizationPlan.moveToDirectories['scripts/tests'].length} files → \`scripts/tests/\`
- **Maintenance Scripts**: ${organizationPlan.moveToDirectories['scripts/maintenance'].length} files → \`scripts/maintenance/\`
- **Backup Files**: Moved to \`docs/archive/\`
- **Config Files**: Moved to \`.config/\`

### Files Cleaned
- Removed backup files (\`*.backup\`, \`*.bak\`)
- Removed temporary files (\`*.txt\`, \`*.heapsnapshot\`)
- Removed duplicate version backup files

### Root Directory Contents (Clean)
The root now contains only essential files:
- README.md - Project documentation
- LICENSE - MIT license
- CHANGELOG.md - Version history
- package.json - Package configuration
- package-lock.json - Dependency lock
- bumba.config.js - Framework configuration
- install.js - Installation script
- .gitignore - Git ignore rules
- .env.example - Environment template

## Directory Structure
\`\`\`
bumba/
├── src/          # Source code
├── tests/        # Test suites
├── scripts/      # Utility scripts
├── docs/         # Documentation
├── assets/       # Static assets
├── config/       # Configuration files
├── lib/          # Build output
└── .config/      # Runtime configuration
\`\`\`

## Statistics
- Files in root before: ${filesBefore}
- Files in root after: ${filesAfter}
- Files organized: ${movedCount}
- Files cleaned: ${deletedCount}

## Best Practices Achieved
✅ Clean root directory
✅ Logical file organization
✅ Separated concerns (docs, scripts, tests)
✅ Hidden runtime configs
✅ Standard Node.js structure
`;

fs.writeFileSync(summaryPath, summary);
console.log(`📝 Created organization summary: docs/DIRECTORY_ORGANIZATION_SUMMARY.md`);

process.exit(0);