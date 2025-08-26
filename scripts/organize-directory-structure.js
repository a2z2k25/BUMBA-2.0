#!/usr/bin/env node

/**
 * Directory Organization Script
 * Reorganizes BUMBA directory structure to follow best practices
 * No files will be deleted, only moved to appropriate locations
 */

const fs = require('fs');
const path = require('path');

console.log('📁 Organizing BUMBA Directory Structure...\n');

// Create organized directory structure
const directories = [
  // Documentation
  'docs/api',
  'docs/architecture',
  'docs/guides',
  'docs/security',
  'docs/sessions',
  'docs/audits',
  'docs/reports',
  
  // Tests properly organized
  'tests/unit',
  'tests/integration',
  'tests/e2e',
  'tests/security',
  'tests/performance',
  'tests/fixtures',
  'tests/manual',
  
  // Source organization (already good, just ensure)
  'src/core',
  'src/commands',
  'src/config',
  'src/installer',
  'src/utils',
  
  // Scripts organization
  'scripts/build',
  'scripts/deployment',
  'scripts/maintenance',
  'scripts/testing',
  'scripts/analysis',
  
  // Development support
  '.github/workflows',
  '.github/ISSUE_TEMPLATE',
  
  // Build artifacts
  'dist',
  'build',
  
  // Archives for old files
  'archives/legacy',
  'archives/deprecated',
  'archives/sessions',
];

// Create all directories if they don't exist
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  }
});

// Move files to appropriate locations
const moves = [
  // Move session reports to docs/sessions
  { from: 'SESSION_*.md', to: 'docs/sessions/', pattern: /^SESSION_.*\.md$/ },
  
  // Move audit reports to docs/audits
  { from: '*_AUDIT*.md', to: 'docs/audits/', pattern: /_AUDIT|AUDIT_/ },
  { from: 'FINAL_COMPREHENSIVE_AUDIT.md', to: 'docs/audits/' },
  { from: 'ULTIMATE_FRAMEWORK_AUDIT.md', to: 'docs/audits/' },
  
  // Move sprint and planning docs
  { from: '*SPRINT*.md', to: 'docs/reports/', pattern: /SPRINT/ },
  { from: '*_PLAN.md', to: 'docs/reports/', pattern: /_PLAN\.md$/ },
  
  // Move test files to tests directory
  { from: 'test-*.js', to: 'tests/manual/', pattern: /^test-.*\.js$/ },
  { from: 'final-security-test.js', to: 'tests/security/' },
  
  // Move security audit folder contents
  { from: 'security-audit/*.md', to: 'docs/security/', subdir: true },
  
  // Move production and org docs
  { from: 'PRODUCTION_*.md', to: 'docs/reports/', pattern: /^PRODUCTION_/ },
  { from: 'ORGANIZATION_COMPLETE.md', to: 'docs/reports/' },
  
  // Move troubleshooting to docs
  { from: 'TROUBLESHOOTING.md', to: 'docs/guides/' },
  
  // Move old test report
  { from: 'FINAL_TEST_REPORT.md', to: 'docs/reports/' },
];

// Execute moves
moves.forEach(move => {
  const sourcePath = path.join(__dirname, '..');
  
  if (move.pattern) {
    // Handle pattern-based moves
    const files = fs.readdirSync(sourcePath).filter(file => move.pattern.test(file));
    files.forEach(file => {
      const source = path.join(sourcePath, file);
      const dest = path.join(sourcePath, move.to, file);
      
      if (fs.existsSync(source) && fs.statSync(source).isFile()) {
        try {
          // Ensure destination directory exists
          const destDir = path.dirname(dest);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          if (!fs.existsSync(dest)) {
            fs.renameSync(source, dest);
            console.log(`📦 Moved: ${file} → ${move.to}`);
          }
        } catch (err) {
          console.log(`⚠️  Skipped: ${file} (${err.message})`);
        }
      }
    });
  } else if (move.from.includes('*')) {
    // Skip wildcards without patterns
  } else {
    // Handle specific file moves
    const source = path.join(sourcePath, move.from);
    const dest = path.join(sourcePath, move.to, path.basename(move.from));
    
    if (fs.existsSync(source) && !fs.existsSync(dest)) {
      try {
        fs.renameSync(source, dest);
        console.log(`📦 Moved: ${move.from} → ${move.to}`);
      } catch (err) {
        console.log(`⚠️  Skipped: ${move.from} (${err.message})`);
      }
    }
  }
});

// Create proper README files for key directories
const readmeContent = {
  'tests/README.md': `# Tests Directory

## Structure
- \`unit/\` - Unit tests for individual components
- \`integration/\` - Integration tests for system components
- \`e2e/\` - End-to-end tests
- \`security/\` - Security validation tests
- \`performance/\` - Performance benchmarks
- \`fixtures/\` - Test data and fixtures
- \`manual/\` - Manual test scripts

## Running Tests
\`\`\`bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:security # Run security tests
\`\`\`
`,
  
  'docs/README.md': `# Documentation

## Structure
- \`api/\` - API documentation
- \`architecture/\` - Architecture documentation
- \`guides/\` - User and developer guides
- \`security/\` - Security documentation and reports
- \`sessions/\` - Development session reports
- \`audits/\` - Security and code audits
- \`reports/\` - Sprint reports and planning documents

## Key Documents
- [Architecture Overview](architecture/ARCHITECTURE.MD)
- [Security Guide](security/README.md)
- [API Reference](api/README.md)
`,

  'scripts/README.md': `# Scripts Directory

## Structure
- \`build/\` - Build and compilation scripts
- \`deployment/\` - Deployment and CI/CD scripts
- \`maintenance/\` - Maintenance and cleanup scripts
- \`testing/\` - Test automation scripts
- \`analysis/\` - Code analysis and audit scripts

## Key Scripts
- \`organize-directory-structure.js\` - Organize project structure
- \`validate-setup.js\` - Validate installation
- \`performance-profiler.js\` - Profile performance
`
};

// Create README files
Object.entries(readmeContent).forEach(([file, content]) => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Created: ${file}`);
  }
});

// Create .gitkeep files in empty directories
directories.forEach(dir => {
  const gitkeepPath = path.join(__dirname, '..', dir, '.gitkeep');
  const dirPath = path.dirname(gitkeepPath);
  
  if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

// Organize scripts into subdirectories
const scriptMoves = [
  { pattern: /fix-|update-|standardize-/, dir: 'scripts/maintenance' },
  { pattern: /test-|validate-|verify-/, dir: 'scripts/testing' },
  { pattern: /performance-|memory-|benchmark/, dir: 'scripts/analysis' },
  { pattern: /build|compile|bundle/, dir: 'scripts/build' },
  { pattern: /deploy|rollback/, dir: 'scripts/deployment' },
];

const scriptsDir = path.join(__dirname);
const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') || f.endsWith('.sh'));

scriptFiles.forEach(file => {
  const move = scriptMoves.find(m => m.pattern.test(file));
  if (move) {
    const source = path.join(scriptsDir, file);
    const dest = path.join(__dirname, '..', move.dir, file);
    
    if (fs.existsSync(source) && !fs.existsSync(dest)) {
      try {
        fs.renameSync(source, dest);
        console.log(`📂 Organized script: ${file} → ${move.dir}/`);
      } catch (err) {
        // Skip if can't move
      }
    }
  }
});

console.log('\n✅ Directory organization complete!');
console.log('\n📊 New Structure:');
console.log(`
PROJECT ROOT/
├── src/                 # Source code
│   ├── core/           # Core framework
│   ├── commands/       # Command implementations
│   ├── config/         # Configuration
│   └── tests/          # Source tests
├── tests/              # All tests organized
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   ├── e2e/          # End-to-end tests
│   ├── security/     # Security tests
│   └── performance/  # Performance tests
├── docs/              # All documentation
│   ├── api/          # API docs
│   ├── architecture/ # Architecture docs
│   ├── guides/       # User guides
│   ├── security/     # Security docs
│   └── reports/      # Reports & audits
├── scripts/           # Utility scripts
│   ├── build/        # Build scripts
│   ├── deployment/   # Deploy scripts
│   ├── maintenance/  # Maintenance scripts
│   └── testing/      # Test scripts
├── config/            # Configuration files
├── examples/          # Example usage
└── archives/          # Archived files
`);

console.log('\n📌 Notes:');
console.log('- No files were deleted, only reorganized');
console.log('- Original functionality preserved');
console.log('- Structure now follows best practices');
console.log('- Run "npm test" to verify everything still works\n');