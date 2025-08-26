#!/usr/bin/env node

/**
 * Fix Documentation Specialists Import Issues
 * Sprint 6 - Fix import paths for documentation specialists
 */

const fs = require('fs');
const path = require('path');

const docSpecialistsDir = path.join(__dirname, '..', 'src', 'core', 'specialists', 'documentation');

// List of files to fix
const filesToFix = [
  'api-documenter.js',
  'docs-architect.js',
  'mermaid-expert.js',
  'reference-builder.js',
  'tutorial-engineer.js'
];

let fixed = 0;
let alreadyCorrect = 0;
let errors = 0;

filesToFix.forEach(file => {
  const filePath = path.join(docSpecialistsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    errors++;
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // These files use ../specialist-agent (one level up)
  if (content.includes("const { SpecialistAgent } = require('../specialist-agent');")) {
    content = content.replace("const { SpecialistAgent } = require('../specialist-agent');\n", '');
    modified = true;
  }
  
  // Fix logger path from ../logging to ../../logging
  if (content.includes("require('../logging/bumba-logger')")) {
    content = content.replace(
      "require('../logging/bumba-logger')",
      "require('../../logging/bumba-logger')"
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

console.log(`\n📊 Documentation Specialists Summary:`);
console.log(`   Fixed: ${fixed} files`);
console.log(`   Already correct: ${alreadyCorrect} files`);
console.log(`   Errors: ${errors} files`);
console.log(`   Total processed: ${fixed + alreadyCorrect} files`);