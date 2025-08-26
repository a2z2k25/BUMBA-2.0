#!/usr/bin/env node

/**
 * Fix Remaining Specialists Import Issues
 * Sprint 7 & beyond - Fix import paths for all remaining specialists
 */

const fs = require('fs');
const path = require('path');

// Categories and their directories
const specialistCategories = [
  {
    name: 'Data/AI',
    dir: path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'data-ai'),
    files: ['ai-engineer.js', 'data-engineer.js', 'data-scientist.js', 'ml-engineer.js', 'mlops-engineer.js', 'prompt-engineer.js']
  },
  {
    name: 'Advanced Technical',
    dir: path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'advanced'),
    files: ['blockchain-engineer.js', 'flutter-expert.js', 'game-developer.js', 'ios-developer.js', 'mobile-developer.js', 'unity-developer.js', 'minecraft-specialist.js']
  },
  {
    name: 'QA/Testing',
    dir: path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'qa'),
    files: ['code-reviewer.js', 'debugger-specialist.js', 'incident-responder.js', 'performance-engineer.js', 'security-auditor.js']
  },
  {
    name: 'DevOps',
    dir: path.join(__dirname, '..', 'src', 'core', 'specialists', 'technical', 'devops'),
    files: ['cloud-architect.js', 'deployment-engineer.js', 'devops-engineer.js', 'kubernetes-specialist.js', 'network-engineer.js', 'sre-specialist.js', 'terraform-specialist.js']
  }
];

let totalFixed = 0;
let totalAlreadyCorrect = 0;
let totalErrors = 0;

specialistCategories.forEach(category => {
  console.log(`\n📂 Processing ${category.name} specialists...`);
  let fixed = 0;
  let alreadyCorrect = 0;
  let errors = 0;
  
  category.files.forEach(file => {
    const filePath = path.join(category.dir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${file}`);
      errors++;
      totalErrors++;
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
    
    // Some files might have different logger path patterns
    if (content.includes("require('../logging/bumba-logger')")) {
      content = content.replace(
        "require('../logging/bumba-logger')",
        "require('../../../logging/bumba-logger')"
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Fixed: ${file}`);
      fixed++;
      totalFixed++;
    } else {
      alreadyCorrect++;
      totalAlreadyCorrect++;
    }
  });
  
  console.log(`  Summary: ${fixed} fixed, ${alreadyCorrect} already correct, ${errors} errors`);
});

console.log(`\n📊 TOTAL SUMMARY:`);
console.log(`   Fixed: ${totalFixed} files`);
console.log(`   Already correct: ${totalAlreadyCorrect} files`);
console.log(`   Errors: ${totalErrors} files`);
console.log(`   Total processed: ${totalFixed + totalAlreadyCorrect} files`);