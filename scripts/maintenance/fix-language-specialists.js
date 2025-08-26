#!/usr/bin/env node

/**
 * Fix Language Specialists Import Issues
 * Sprint 3 & 4 - Fix import paths for language specialists
 */

const fs = require('fs');
const path = require('path');

const languageSpecialistsDir = path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'languages');

// List of files to fix
const filesToFix = [
  'c-specialist.js',
  'cpp-specialist.js', 
  'csharp-specialist.js',
  'elixir-specialist.js',
  'golang-specialist.js',
  'java-specialist.js',
  'php-specialist.js',
  'python-specialist.js',
  'ruby-specialist.js',
  'rust-specialist.js',
  'scala-specialist.js',
  'typescript-specialist.js'
];

let fixed = 0;
let alreadyCorrect = 0;

filesToFix.forEach(file => {
  const filePath = path.join(languageSpecialistsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
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

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixed} files`);
console.log(`   Already correct: ${alreadyCorrect} files`);
console.log(`   Total processed: ${fixed + alreadyCorrect} files`);