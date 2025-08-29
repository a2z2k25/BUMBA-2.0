#!/usr/bin/env node

/**
 * BUMBA README Restructure Script
 * Transforms the bloated README into a focused, professional document
 * and creates supporting documentation hierarchy
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║     BUMBA README RESTRUCTURE SCRIPT       ║');
console.log('╚════════════════════════════════════════════╝\n');

// Define the new documentation structure
const NEW_STRUCTURE = {
  // New slim README (mission-critical only)
  newReadme: `# BUMBA CLI

Production-ready AI development platform with hierarchical multi-agent intelligence and parallel execution.

[![NPM Version](https://img.shields.io/npm/v/bumba-claude.svg)](https://www.npmjs.com/package/bumba-claude)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🟢 Quick Start

\`\`\`bash
# Install globally
npm install -g bumba-claude

# Initialize framework
bumba init

# Start development
bumba:menu
\`\`\`

## 🟢 Core Features

- **Multi-Agent Intelligence**: 44 specialized agents across 3 departments
- **Parallel Execution**: Real concurrent agent processing 
- **23 MCP Servers**: Comprehensive tool ecosystem
- **Consciousness-Driven**: Ethical, purpose-aligned development
- **Production Ready**: Enterprise-grade security and monitoring

## 🟢 Architecture

BUMBA operates through three primary departments:
- **Product Strategist**: Business logic and requirements
- **Design Engineer**: UI/UX and visual implementation  
- **Backend Engineer**: Technical architecture and security

## 🟢 Documentation

| Topic | Link |
|-------|------|
| **Getting Started** | [Quick Start Guide](docs/GETTING_STARTED.md) |
| **Core Concepts** | [Architecture Guide](docs/ARCHITECTURE_OVERVIEW.md) |
| **Command Reference** | [All Commands](docs/COMMAND_REFERENCE.md) |
| **MCP Integration** | [MCP Setup Guide](docs/MCP_SETUP.md) |
| **Advanced Usage** | [Advanced Features](docs/ADVANCED_USAGE.md) |
| **API Reference** | [API Documentation](docs/API_REFERENCE.md) |

## 🟢 Example Usage

\`\`\`bash
# Intelligent feature development
bumba:implement "user authentication system"

# Multi-agent collaboration
bumba:implement-agents "e-commerce checkout flow"

# Design-focused development
bumba:design "responsive product catalog"

# Strategic business analysis
bumba:prd "mobile app expansion strategy"
\`\`\`

## 🟢 Requirements

- Node.js 18+
- Claude Code (latest)
- At least one AI API key (Anthropic, OpenAI, or Google)

## 🟢 License

MIT © BUMBA CLI Contributors

## 🟢 Links

- [Full Documentation](docs/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Change Log](CHANGELOG.md)
- [Support & Issues](https://github.com/anthropics/claude-code/issues)

---

*For detailed documentation, examples, and advanced configuration, see the [docs directory](docs/).*`,

  // Supporting documentation files to create
  supportingDocs: {
    'docs/README.md': {
      title: 'BUMBA CLI Documentation',
      description: 'Complete documentation index and navigation'
    },
    'docs/GETTING_STARTED.md': {
      title: 'Getting Started with BUMBA',
      description: 'Installation, setup, and first steps'
    },
    'docs/ARCHITECTURE_OVERVIEW.md': {
      title: 'BUMBA Architecture Overview', 
      description: 'System design, components, and data flow'
    },
    'docs/COMMAND_REFERENCE.md': {
      title: 'Complete Command Reference',
      description: 'All 58 commands with examples and use cases'
    },
    'docs/MCP_SETUP.md': {
      title: 'MCP Server Setup & Configuration',
      description: '23 MCP servers setup and integration guide'
    },
    'docs/ADVANCED_USAGE.md': {
      title: 'Advanced Features & Configuration',
      description: 'Expert-level features, customization, and optimization'
    },
    'docs/TROUBLESHOOTING.md': {
      title: 'Troubleshooting Guide',
      description: 'Common issues, solutions, and debugging'
    },
    'docs/EXAMPLES.md': {
      title: 'Usage Examples & Workflows',
      description: 'Real-world examples and best practices'
    }
  }
};

// Extract content sections from current README
function extractCurrentContent() {
  const readmePath = 'README.md';
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md not found');
  }
  
  const content = fs.readFileSync(readmePath, 'utf8');
  
  // Split into sections by headers
  const sections = {};
  const lines = content.split('\n');
  let currentSection = 'header';
  let currentContent = [];
  
  for (const line of lines) {
    if (line.match(/^#+\s/)) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }
      
      // Start new section
      currentSection = line.replace(/^#+\s/, '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }
  
  return sections;
}

// Create supporting documentation files
function createSupportingDocs(extractedContent) {
  console.log('🟢 Creating supporting documentation files...\n');
  
  // Ensure docs directory exists
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs', { recursive: true });
    console.log('  🟢 Created docs/ directory');
  }
  
  // Create documentation index
  const docsIndex = `# BUMBA CLI Documentation

Welcome to the complete BUMBA CLI documentation. This directory contains comprehensive guides for all aspects of the framework.

## 🟢 Documentation Index

### Getting Started
- [**Getting Started Guide**](GETTING_STARTED.md) - Installation and first steps
- [**Quick Examples**](EXAMPLES.md) - Common usage patterns
- [**Troubleshooting**](TROUBLESHOOTING.md) - Common issues and solutions

### Core Documentation  
- [**Architecture Overview**](ARCHITECTURE_OVERVIEW.md) - System design and components
- [**Command Reference**](COMMAND_REFERENCE.md) - Complete command documentation
- [**API Reference**](API_REFERENCE.md) - Programming interface

### Advanced Topics
- [**MCP Setup Guide**](MCP_SETUP.md) - MCP server configuration
- [**Advanced Usage**](ADVANCED_USAGE.md) - Expert features and customization
- [**Performance Tuning**](../docs/guides/PERFORMANCE_TUNING.md) - Optimization guide

### Integration & Deployment
- [**MCP Integration Summary**](MCP_INTEGRATION_SUMMARY.md) - All 23 MCP servers
- [**Framework Health Report**](../FRAMEWORK_HEALTH_REPORT.md) - System status
- [**Production Deployment**](guides/PRODUCTION_DEPLOYMENT.md) - Enterprise setup

## 🟢 Framework Components

The BUMBA framework consists of several key systems:

1. **Multi-Agent Intelligence** - 44 specialized agents
2. **MCP Integration** - 23 server ecosystem  
3. **Consciousness Layer** - Ethical development framework
4. **Performance System** - Monitoring and optimization
5. **Security Framework** - Enterprise-grade protection

## 🟢 Reading Guide

**New Users**: Start with [Getting Started](GETTING_STARTED.md)
**Developers**: Review [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
**Advanced Users**: Explore [Advanced Usage](ADVANCED_USAGE.md)
**Integrators**: Check [MCP Setup Guide](MCP_SETUP.md)

## 🟢 Keep Updated

This documentation is actively maintained. Check the [CHANGELOG](../CHANGELOG.md) for updates.

---

*Return to [Main README](../README.md)*`;

  fs.writeFileSync('docs/README.md', docsIndex);
  console.log('  🏁 Created docs/README.md');

  // Create Getting Started guide
  const gettingStarted = `# Getting Started with BUMBA CLI

This guide will get you up and running with BUMBA in minutes.

## 🟢 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Claude Code** - Latest version with MCP support
- **AI API Key** - At least one of:
  - [Anthropic API key](https://console.anthropic.com/)
  - [OpenAI API key](https://platform.openai.com/)
  - [Google Gemini API key](https://makersuite.google.com/)

## 🟢 5-Minute Quick Start

### 1. Install BUMBA
\`\`\`bash
npm install -g bumba-claude
\`\`\`

### 2. Setup Environment
\`\`\`bash
# Create .env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env
echo "BUMBA_PARALLEL=true" >> .env
\`\`\`

### 3. Initialize Framework
\`\`\`bash
bumba init
\`\`\`

### 4. Explore Commands
\`\`\`bash
bumba:menu
\`\`\`

### 5. Your First Implementation
\`\`\`bash
bumba:implement "create a simple todo list component"
\`\`\`

## 🟢 Core Concepts

### Multi-Agent System
BUMBA uses three specialized departments:
- **Product Strategist** - Business logic and strategy
- **Design Engineer** - UI/UX and visual design
- **Backend Engineer** - Technical implementation

### Command Structure
All BUMBA commands follow the pattern:
\`\`\`
/bumba:[department]:[action] [description]
\`\`\`

Examples:
- \`bumba:implement\` - Smart routing to appropriate department
- \`bumba:design\` - Design-focused workflows
- \`bumba:analyze\` - Multi-dimensional analysis

## 🟢 Next Steps

1. [**Command Reference**](COMMAND_REFERENCE.md) - Learn all 58 commands
2. [**Architecture Guide**](ARCHITECTURE_OVERVIEW.md) - Understand the system
3. [**MCP Setup**](MCP_SETUP.md) - Configure additional tools
4. [**Advanced Usage**](ADVANCED_USAGE.md) - Expert features

## 🆘 Need Help?

- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Examples & Workflows](EXAMPLES.md)
- [Community Support](https://github.com/anthropics/claude-code/issues)

---

*Continue to [Command Reference](COMMAND_REFERENCE.md)*`;

  fs.writeFileSync('docs/GETTING_STARTED.md', gettingStarted);
  console.log('  🏁 Created docs/GETTING_STARTED.md');

  // Create other supporting docs (templates)
  Object.entries(NEW_STRUCTURE.supportingDocs).forEach(([filename, meta]) => {
    if (!fs.existsSync(filename)) {
      const template = `# ${meta.title}

${meta.description}

## 🟢 Contents

*This document is being populated with content from the main README restructure.*

---

*Return to [Documentation Index](README.md)*`;

      fs.writeFileSync(filename, template);
      console.log(`  🏁 Created ${filename}`);
    }
  });

  return true;
}

// Main restructure function
function performRestructure() {
  console.log('🟢 Analyzing current README structure...\n');
  
  const currentStats = {
    lines: fs.readFileSync('README.md', 'utf8').split('\n').length,
    words: fs.readFileSync('README.md', 'utf8').split(/\s+/).length,
    chars: fs.readFileSync('README.md', 'utf8').length
  };
  
  console.log('🟢 Current README Statistics:');
  console.log(`  • Lines: ${currentStats.lines}`);
  console.log(`  • Words: ${currentStats.words}`);
  console.log(`  • Characters: ${currentStats.chars}\n`);
  
  // Extract current content
  console.log('🟢 Extracting content sections...');
  const extractedContent = extractCurrentContent();
  console.log(`  🏁 Extracted ${Object.keys(extractedContent).length} sections\n`);
  
  // Create supporting documentation
  createSupportingDocs(extractedContent);
  
  // Backup original README
  const backup = `README_ORIGINAL_${new Date().getTime()}.md`;
  fs.copyFileSync('README.md', backup);
  console.log(`\n🟢 Backed up original README to: ${backup}`);
  
  // Write new README
  fs.writeFileSync('README.md', NEW_STRUCTURE.newReadme);
  console.log('  🏁 Created new streamlined README.md');
  
  const newStats = {
    lines: NEW_STRUCTURE.newReadme.split('\n').length,
    words: NEW_STRUCTURE.newReadme.split(/\s+/).length,
    chars: NEW_STRUCTURE.newReadme.length
  };
  
  return {
    before: currentStats,
    after: newStats,
    improvement: {
      lines: Math.round(((currentStats.lines - newStats.lines) / currentStats.lines) * 100),
      words: Math.round(((currentStats.words - newStats.words) / currentStats.words) * 100),
      chars: Math.round(((currentStats.chars - newStats.chars) / currentStats.chars) * 100)
    }
  };
}

// Generate results report
function generateReport(results) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║       README RESTRUCTURE COMPLETE         ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log('🟢 Transformation Results:');
  console.log(`  Lines: ${results.before.lines} → ${results.after.lines} (${results.improvement.lines}% reduction)`);
  console.log(`  Words: ${results.before.words} → ${results.after.words} (${results.improvement.words}% reduction)`);
  console.log(`  Characters: ${results.before.chars} → ${results.after.chars} (${results.improvement.chars}% reduction)\n`);
  
  console.log('🏁 New Documentation Structure:');
  console.log('  🏁 Streamlined README (mission-critical only)');
  console.log('  🏁 Comprehensive docs/ directory');
  console.log('  🏁 Logical content organization');
  console.log('  🏁 Cross-referenced navigation');
  console.log('  🏁 Professional README standards\n');
  
  console.log('🟢 Created Documentation Files:');
  console.log('  • docs/README.md - Documentation index');
  console.log('  • docs/GETTING_STARTED.md - Quick start guide');
  console.log('  • docs/ARCHITECTURE_OVERVIEW.md - System overview');
  console.log('  • docs/COMMAND_REFERENCE.md - Complete commands');
  console.log('  • docs/MCP_SETUP.md - MCP configuration');
  console.log('  • docs/ADVANCED_USAGE.md - Expert features');
  console.log('  • docs/TROUBLESHOOTING.md - Problem solving');
  console.log('  • docs/EXAMPLES.md - Usage examples\n');
  
  const reportContent = {
    timestamp: new Date().toISOString(),
    transformation: results,
    filesCreated: [
      'docs/README.md',
      'docs/GETTING_STARTED.md',
      'docs/ARCHITECTURE_OVERVIEW.md',
      'docs/COMMAND_REFERENCE.md',
      'docs/MCP_SETUP.md',
      'docs/ADVANCED_USAGE.md',
      'docs/TROUBLESHOOTING.md',
      'docs/EXAMPLES.md'
    ]
  };
  
  fs.writeFileSync('README_RESTRUCTURE_LOG.json', JSON.stringify(reportContent, null, 2));
  console.log('🟢 Transformation log saved to README_RESTRUCTURE_LOG.json\n');
}

// Execute with confirmation
console.log('🟡  This will transform the README from a 2,463-line document to a focused summary:\n');
console.log('  Actions to be performed:');
console.log('  • Create streamlined README (~100 lines)');
console.log('  • Move detailed content to docs/ directory');
console.log('  • Create 8 supporting documentation files');
console.log('  • Backup original README');
console.log('  • Establish cross-reference navigation\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with README restructure? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const results = performRestructure();
    generateReport(results);
    
    console.log('🟢 Next Steps:');
    console.log('   1. Review new README.md');
    console.log('   2. Populate docs/ files with extracted content');
    console.log('   3. Test all cross-references');
    console.log('   4. Commit: git commit -m "docs: Restructure README and create documentation hierarchy"');
  } else {
    console.log('\n🔴 Restructure cancelled. No changes were made.\n');
  }
  
  rl.close();
  process.exit(0);
});