#!/usr/bin/env node

/**
 * Fix specialists with missing or incorrect imports
 */

const fs = require('fs');
const path = require('path');

const specialistsWithIssues = [
  'technical/data-ai/ai-specialist.js',
  'technical/data-ai/data-engineer-specialist.js',
  'technical/data-ai/data-scientist-specialist.js',
  'technical/data-ai/llm-specialist.js',
  'technical/data-ai/ml-engineer-specialist.js',
  'technical/data-ai/mlops-specialist.js',
  'technical/database/dynamodb-specialist.js',
  'technical/database/mongodb-specialist.js',
  'technical/database/mysql-specialist.js',
  'technical/database/postgresql-specialist.js',
  'technical/database/redis-specialist.js',
  'technical/devops/aws-specialist.js',
  'technical/devops/cicd-specialist.js',
  'technical/devops/docker-specialist.js',
  'technical/devops/jenkins-specialist.js',
  'technical/qa/performance-testing-specialist.js',
  'technical/qa/qa-lead-specialist.js',
  'technical/advanced/mobile-development-specialist.js'
];

const baseDir = '/Users/az/Code/bumba/src/core/specialists';
let fixedCount = 0;

specialistsWithIssues.forEach(relativePath => {
  const filePath = path.join(baseDir, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`🟠 File not found: ${relativePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find if there's an incorrect import
  let hasIncorrectImport = false;
  let importLineIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const SpecialistBase = require')) {
      hasIncorrectImport = true;
      importLineIndex = i;
      break;
    }
  }
  
  // Check if class extends UnifiedSpecialistBase
  const extendsUnified = content.includes('extends UnifiedSpecialistBase');
  
  if (extendsUnified && (hasIncorrectImport || !content.includes('const UnifiedSpecialistBase'))) {
    // Fix the import
    let fixed = content;
    
    if (hasIncorrectImport) {
      // Replace the incorrect import
      lines[importLineIndex] = `const UnifiedSpecialistBase = require('../../unified-specialist-base');`;
      fixed = lines.join('\n');
    } else {
      // Add the import after the header comment
      const headerEndIndex = lines.findIndex(line => !line.startsWith('/**') && !line.startsWith(' *') && line.trim() !== '');
      lines.splice(headerEndIndex, 0, '', `const UnifiedSpecialistBase = require('../../unified-specialist-base');`);
      fixed = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, fixed);
    console.log(`🏁 Fixed: ${relativePath}`);
    fixedCount++;
  }
});

console.log(`\n🟡 Fixed ${fixedCount} files with missing imports.`);