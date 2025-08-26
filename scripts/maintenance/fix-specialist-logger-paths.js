#!/usr/bin/env node

/**
 * Fix Specialist Logger Paths
 * Safely corrects the logger import paths in specialist files
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/core/logging/bumba-logger');

class LoggerPathFixer {
  constructor() {
    this.stats = {
      filesScanned: 0,
      filesFixed: 0,
      errors: [],
      backups: []
    };
    
    this.incorrectPath = "../../../logging/bumba-logger";
    this.correctPath = "../../logging/bumba-logger";
  }

  async fix() {
    console.log('\n' + '='.repeat(60));
    console.log('SPECIALIST LOGGER PATH FIXER');
    console.log('='.repeat(60) + '\n');
    
    try {
      // Step 1: Find all affected files
      const affectedFiles = await this.findAffectedFiles();
      
      if (affectedFiles.length === 0) {
        console.log('✅ No files need fixing!');
        return;
      }
      
      console.log(`Found ${affectedFiles.length} files with incorrect logger paths:\n`);
      affectedFiles.forEach(file => {
        console.log(`  - ${path.basename(file)}`);
      });
      
      // Step 2: Create backups
      console.log('\n📦 Creating backups...');
      await this.createBackups(affectedFiles);
      
      // Step 3: Fix the files
      console.log('\n🔧 Fixing logger paths...');
      await this.fixFiles(affectedFiles);
      
      // Step 4: Verify fixes
      console.log('\n✅ Verifying fixes...');
      await this.verifyFixes(affectedFiles);
      
      // Step 5: Report
      this.report();
      
    } catch (error) {
      console.error('❌ Error during fix:', error);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Find all files with incorrect logger paths
   */
  async findAffectedFiles() {
    const specialistsDir = path.join(__dirname, '../src/core/specialists');
    const affectedFiles = [];
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.js')) {
          this.stats.filesScanned++;
          const content = fs.readFileSync(filePath, 'utf-8');
          
          if (content.includes(this.incorrectPath)) {
            affectedFiles.push(filePath);
          }
        }
      }
    };
    
    scanDirectory(specialistsDir);
    return affectedFiles;
  }

  /**
   * Create backups of files to be modified
   */
  async createBackups(files) {
    const backupDir = path.join(__dirname, '../backups/specialist-logger-fix');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    
    for (const file of files) {
      const filename = path.basename(file);
      const backupPath = path.join(backupDir, `${filename}.backup-${timestamp}`);
      fs.copyFileSync(file, backupPath);
      this.stats.backups.push({ original: file, backup: backupPath });
      console.log(`  ✓ Backed up ${filename}`);
    }
  }

  /**
   * Fix the logger paths in the files
   */
  async fixFiles(files) {
    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf-8');
        
        // Fix the require statement
        const oldRequire = `require('${this.incorrectPath}')`;
        const newRequire = `require('${this.correctPath}')`;
        
        if (content.includes(oldRequire)) {
          content = content.replace(oldRequire, newRequire);
          fs.writeFileSync(file, content, 'utf-8');
          this.stats.filesFixed++;
          console.log(`  ✓ Fixed ${path.basename(file)}`);
        }
        
      } catch (error) {
        console.error(`  ✗ Failed to fix ${path.basename(file)}: ${error.message}`);
        this.stats.errors.push({ file, error: error.message });
      }
    }
  }

  /**
   * Verify that fixes work
   */
  async verifyFixes(files) {
    for (const file of files) {
      try {
        // Try to require the file to check if it loads
        delete require.cache[require.resolve(file)];
        require(file);
        console.log(`  ✓ ${path.basename(file)} loads correctly`);
      } catch (error) {
        // Check if it's a different error (not the logger path issue)
        if (error.message.includes('logging/bumba-logger')) {
          console.error(`  ✗ ${path.basename(file)} still has logger issues`);
          this.stats.errors.push({ file, error: 'Still has logger path issues' });
        } else {
          // Different error, but the logger path is fixed
          console.log(`  ⚠ ${path.basename(file)} has other issues but logger path is fixed`);
        }
      }
    }
  }

  /**
   * Rollback changes if something goes wrong
   */
  async rollback() {
    console.log('\n⚠️ Rolling back changes...');
    
    for (const backup of this.stats.backups) {
      try {
        fs.copyFileSync(backup.backup, backup.original);
        console.log(`  ✓ Restored ${path.basename(backup.original)}`);
      } catch (error) {
        console.error(`  ✗ Failed to restore ${path.basename(backup.original)}`);
      }
    }
    
    console.log('✅ Rollback complete');
  }

  /**
   * Report results
   */
  report() {
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Files scanned: ${this.stats.filesScanned}`);
    console.log(`Files fixed: ${this.stats.filesFixed}`);
    console.log(`Backups created: ${this.stats.backups.length}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.stats.errors.forEach(err => {
        console.log(`  - ${path.basename(err.file)}: ${err.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.stats.filesFixed > 0) {
      console.log('\n✅ SUCCESS: Logger paths have been fixed!');
      console.log('\nNext steps:');
      console.log('1. Test the lazy loading: node scripts/test-lazy-managers.js');
      console.log('2. Run the full migration: node scripts/migrate-to-lazy-departments.js');
      console.log('3. Monitor memory usage to verify savings');
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new LoggerPathFixer();
  fixer.fix().catch(error => {
    console.error('Fix failed:', error);
    process.exit(1);
  });
}

module.exports = LoggerPathFixer;