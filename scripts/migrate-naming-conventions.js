#!/usr/bin/env node

/**
 * Script to migrate files to follow naming conventions
 * This script will suggest renames but won't automatically change files
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class NamingMigrator {
  constructor() {
    this.suggestions = [];
    this.stats = {
      filesAnalyzed: 0,
      renamesNeeded: 0,
    };
  }

  /**
   * Analyze project for naming convention migrations
   */
  async analyzeProject() {
    console.log('🟢 Analyzing files for naming convention migration...\n');

    // Get all files
    const files = await glob('src/**/*.{js,ts}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    for (const file of files) {
      this.analyzeFile(file);
    }

    this.reportSuggestions();
  }

  /**
   * Analyze a single file
   */
  analyzeFile(filePath) {
    this.stats.filesAnalyzed++;
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    // Convert to kebab-case
    const suggestedName = this.toKebabCase(fileName);
    
    if (fileName !== suggestedName) {
      this.suggestions.push({
        original: filePath,
        suggested: path.join(dirName, suggestedName),
        reason: 'Convert to kebab-case',
      });
      this.stats.renamesNeeded++;
    }
    
    // Check for specific patterns
    this.checkSpecificPatterns(filePath, fileName, dirName);
  }

  /**
   * Convert filename to kebab-case
   */
  toKebabCase(fileName) {
    // Preserve file extension
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    
    // Handle test files specially
    if (base.includes('.test') || base.includes('.spec')) {
      const parts = base.split('.');
      const mainPart = this.convertToKebab(parts[0]);
      return `${mainPart}.${parts.slice(1).join('.')}${ext}`;
    }
    
    return this.convertToKebab(base) + ext;
  }

  /**
   * Convert string to kebab-case
   */
  convertToKebab(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // PascalCase to kebab
      .replace(/_/g, '-') // snake_case to kebab
      .replace(/\s+/g, '-') // spaces to kebab
      .replace(/--+/g, '-') // multiple dashes to single
      .toLowerCase();
  }

  /**
   * Check for specific naming patterns
   */
  checkSpecificPatterns(filePath, fileName, dirName) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file should have specific suffix
    if (content.includes('class') && content.includes('Service') && !fileName.includes('-service')) {
      const base = path.basename(fileName, path.extname(fileName));
      const suggested = `${this.convertToKebab(base)}-service${path.extname(fileName)}`;
      
      if (fileName !== suggested) {
        this.suggestions.push({
          original: filePath,
          suggested: path.join(dirName, suggested),
          reason: 'Add -service suffix for service class',
        });
        this.stats.renamesNeeded++;
      }
    }
    
    if (content.includes('class') && content.includes('Manager') && !fileName.includes('-manager')) {
      const base = path.basename(fileName, path.extname(fileName));
      const suggested = `${this.convertToKebab(base)}-manager${path.extname(fileName)}`;
      
      if (fileName !== suggested) {
        this.suggestions.push({
          original: filePath,
          suggested: path.join(dirName, suggested),
          reason: 'Add -manager suffix for manager class',
        });
        this.stats.renamesNeeded++;
      }
    }
  }

  /**
   * Report migration suggestions
   */
  reportSuggestions() {
    console.log('\n🟢 Naming Convention Migration Analysis\n');
    console.log(`Files analyzed: ${this.stats.filesAnalyzed}`);
    console.log(`Renames needed: ${this.stats.renamesNeeded}`);
    
    if (this.suggestions.length === 0) {
      console.log('\n🏁 All files already follow naming conventions!');
      return;
    }
    
    console.log('\n🟢 Suggested Renames:\n');
    
    // Group by directory
    const byDirectory = {};
    this.suggestions.forEach(s => {
      const dir = path.dirname(s.original);
      if (!byDirectory[dir]) byDirectory[dir] = [];
      byDirectory[dir].push(s);
    });
    
    Object.entries(byDirectory).forEach(([dir, suggestions]) => {
      console.log(`\n${dir}/`);
      suggestions.forEach(s => {
        const oldName = path.basename(s.original);
        const newName = path.basename(s.suggested);
        console.log(`  ${oldName} → ${newName}`);
        console.log(`    Reason: ${s.reason}`);
      });
    });
    
    // Generate migration script
    this.generateMigrationScript();
  }

  /**
   * Generate shell script for migrations
   */
  generateMigrationScript() {
    const scriptPath = path.join(process.cwd(), 'migrate-names.sh');
    
    let script = '#!/bin/bash\n\n';
    script += '# BUMBA Naming Convention Migration Script\n';
    script += '# Generated on ' + new Date().toISOString() + '\n\n';
    script += 'echo "🟢 Starting naming convention migration..."\n\n';
    
    // Add git check
    script += '# Check if in git repository\n';
    script += 'if [ -d .git ]; then\n';
    script += '  echo "🟢 Creating git commit for renames..."\n';
    script += '  git add -A\n';
    script += '  git commit -m "chore: rename files to follow naming conventions" || true\n';
    script += 'fi\n\n';
    
    // Add rename commands
    this.suggestions.forEach(s => {
      script += `# ${s.reason}\n`;
      script += `git mv "${s.original}" "${s.suggested}" 2>/dev/null || mv "${s.original}" "${s.suggested}"\n`;
      
      // Update imports
      const oldName = path.basename(s.original, path.extname(s.original));
      const newName = path.basename(s.suggested, path.extname(s.suggested));
      
      if (oldName !== newName) {
        script += `# Update imports\n`;
        script += `find src -name "*.js" -o -name "*.ts" | xargs sed -i '' "s/'\\.\\/.*${oldName}'/'.\/${newName}'/g" 2>/dev/null || true\n`;
        script += `find src -name "*.js" -o -name "*.ts" | xargs sed -i '' "s/'\\.\\.\\/.*${oldName}'/'..\/${newName}'/g" 2>/dev/null || true\n`;
      }
      script += '\n';
    });
    
    script += 'echo "🏁 Migration complete!"\n';
    script += 'echo "🟡  Please review changes and update any remaining imports manually"\n';
    
    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');
    
    console.log(`\n🟢 Migration script generated: ${scriptPath}`);
    console.log('   Run: ./migrate-names.sh to apply changes');
    console.log('\n🟡  WARNING: Review the script before running!');
    console.log('   The script will rename files and attempt to update imports.');
    console.log('   Make sure you have committed your current changes first.');
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === '--help' || command === '-h') {
  console.log('BUMBA Naming Convention Migration Tool\n');
  console.log('Usage:');
  console.log('  node migrate-naming-conventions.js        Analyze and suggest renames');
  console.log('  node migrate-naming-conventions.js --help Show this help');
  process.exit(0);
}

// Run the migrator
const migrator = new NamingMigrator();
migrator.analyzeProject().catch(console.error);