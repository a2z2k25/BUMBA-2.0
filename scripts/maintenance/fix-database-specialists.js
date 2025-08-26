#!/usr/bin/env node

/**
 * Fix Database Specialists Import Issues
 * Sprint 5 - Fix import paths for database specialists
 */

const fs = require('fs');
const path = require('path');

const databaseSpecialistsDir = path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'database');

// List of files to fix
const filesToFix = [
  'api-architect.js',
  'backend-architect.js',
  'database-admin.js',
  'database-optimizer.js',
  'graphql-architect.js',
  'sql-specialist.js'
];

let fixed = 0;
let alreadyCorrect = 0;
let errors = 0;

filesToFix.forEach(file => {
  const filePath = path.join(databaseSpecialistsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    errors++;
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove duplicate SpecialistAgent import if exists
  if (content.includes("const { SpecialistAgent } = require('../../specialist-agent');")) {
    content = content.replace("const { SpecialistAgent } = require('../../specialist-agent');\n", '');
    modified = true;
  }
  
  // Fix logger path from ../../logging to ../../../logging
  if (content.includes("require('../../logging/bumba-logger')")) {
    content = content.replace(
      "require('../../logging/bumba-logger')",
      "require('../../../logging/bumba-logger')"
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  } else {
    console.log(`✓  Already correct: ${file}`);
    alreadyCorrect++;
  }
});

console.log(`\n📊 Database Specialists Summary:`);
console.log(`   Fixed: ${fixed} files`);
console.log(`   Already correct: ${alreadyCorrect} files`);
console.log(`   Errors: ${errors} files`);
console.log(`   Total processed: ${fixed + alreadyCorrect} files`);