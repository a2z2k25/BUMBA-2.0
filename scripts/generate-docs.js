#!/usr/bin/env node

/**
 * Documentation generation script for BUMBA CLI
 * Generates API documentation in multiple formats
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const jsdoc2md = require('jsdoc-to-markdown');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const API_DOCS_DIR = path.join(DOCS_DIR, 'api');

// Ensure directories exist
[DOCS_DIR, API_DOCS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('🏁 Generating BUMBA API Documentation...\n');

// Generate HTML documentation using JSDoc
console.log('🟢 Generating HTML documentation...');
try {
  execSync('npx jsdoc -c jsdoc.config.json', { stdio: 'inherit' });
  console.log('🏁 HTML documentation generated in docs/api/\n');
} catch (error) {
  console.error('🟢 Failed to generate HTML documentation:', error.message);
}

// Generate Markdown documentation for key modules
console.log('🟢 Generating Markdown documentation...');

const modules = [
  {
    name: 'Unified Routing System',
    files: ['core/unified-routing-system.js'],
    output: 'unified-routing-system.md'
  },
  {
    name: 'Command Handler',
    files: ['core/command-handler.js'],
    output: 'command-handler.md'
  },
  {
    name: 'Security',
    files: ['core/security/command-validator.js', 'core/security/secure-executor.js'],
    output: 'security.md'
  },
  {
    name: 'Performance',
    files: ['core/performance/benchmark.js', 'core/monitoring/performance-monitor.js'],
    output: 'performance.md'
  },
  {
    name: 'Installer',
    files: [
      'installer/index.js',
      'installer/display.js',
      'installer/framework-detector.js',
      'installer/mcp-installer.js',
      'installer/quality-tools.js',
      'installer/file-generator.js',
      'installer/hook-generator.js'
    ],
    output: 'installer.md'
  }
];

modules.forEach(async module => {
  try {
    const files = module.files.map(f => path.join(SOURCE_DIR, f));
    const existingFiles = files.filter(f => fs.existsSync(f));
    
    if (existingFiles.length === 0) {
      console.log(`🟡  No files found for ${module.name}`);
      return;
    }

    const markdown = await jsdoc2md.render({ 
      files: existingFiles,
      heading: 2
    });

    const header = `# ${module.name} API Documentation\n\n`;
    const content = header + markdown;
    
    fs.writeFileSync(path.join(API_DOCS_DIR, module.output), content);
    console.log(`🏁 Generated ${module.output}`);
  } catch (error) {
    console.error(`🟢 Failed to generate ${module.name} docs:`, error.message);
  }
});

// Generate main API index
console.log('\n🟢 Generating API index...');
const indexContent = `# BUMBA CLI API Documentation

## Overview

This directory contains the API documentation for the BUMBA Claude Code Framework.

## Documentation Formats

- **HTML Documentation**: Open \`docs/api/index.html\` in your browser for interactive documentation
- **Markdown Documentation**: Individual markdown files for key modules

## Key Modules

${modules.map(m => `- [${m.name}](${m.output})`).join('\n')}

## Core Systems

### Routing System
The unified routing system handles intelligent task routing to appropriate specialists.
- See: [unified-routing-system.md](unified-routing-system.md)

### Command Handler
Processes and validates user commands with security checks.
- See: [command-handler.md](command-handler.md)

### Security
Comprehensive security validation and command sanitization.
- See: [security.md](security.md)

### Performance Monitoring
Real-time performance tracking and benchmarking.
- See: [performance.md](performance.md)

### Installation System
Modular installer for setting up the BUMBA framework.
- See: [installer.md](installer.md)

## Quick Links

- [TypeScript Definitions](../../src/types/)
- [Test Documentation](../../tests/)
- [Examples](../../examples/)

## Generating Documentation

To regenerate this documentation:

\`\`\`bash
npm run docs
\`\`\`

Or manually:

\`\`\`bash
node scripts/generate-docs.js
\`\`\`
`;

fs.writeFileSync(path.join(API_DOCS_DIR, 'README.md'), indexContent);
console.log('🏁 Generated API index\n');

console.log('🏁 Documentation generation complete!');
console.log('🟢 View HTML docs: open docs/api/index.html');
console.log('🟢 View Markdown docs: see docs/api/*.md');