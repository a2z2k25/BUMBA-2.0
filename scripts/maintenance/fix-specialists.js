#!/usr/bin/env node

/**
 * Fix duplicate declarations in consolidated specialist files
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing specialist consolidation issues...\n');

// Read the core-specialists file
const filePath = path.join(__dirname, '../src/core/specialists/core-specialists.js');
let content = fs.readFileSync(filePath, 'utf8');

// Track what we've seen
const seenClasses = new Set();
const seenFunctions = new Set();
const seenConstants = new Set();

// Split into lines for processing
const lines = content.split('\n');
const outputLines = [];
let inClass = false;
let currentClass = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for class declarations
  const classMatch = line.match(/^class\s+(\w+)/);
  if (classMatch) {
    const className = classMatch[1];
    if (seenClasses.has(className)) {
      console.log(`  🟠️  Skipping duplicate class: ${className}`);
      // Skip until we find the end of the class
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('{')) {
          started = true;
          braceCount += (lines[j].match(/{/g) || []).length;
        }
        if (started && lines[j].includes('}')) {
          braceCount -= (lines[j].match(/}/g) || []).length;
          if (braceCount === 0) {
            i = j;
            break;
          }
        }
      }
      continue;
    }
    seenClasses.add(className);
  }
  
  // Check for function declarations
  const funcMatch = line.match(/^function\s+(\w+)/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    if (seenFunctions.has(funcName)) {
      console.log(`  🟠️  Skipping duplicate function: ${funcName}`);
      // Skip until we find the end of the function
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('{')) {
          started = true;
          braceCount += (lines[j].match(/{/g) || []).length;
        }
        if (started && lines[j].includes('}')) {
          braceCount -= (lines[j].match(/}/g) || []).length;
          if (braceCount === 0) {
            i = j;
            break;
          }
        }
      }
      continue;
    }
    seenFunctions.add(funcName);
  }
  
  // Check for const/let/var declarations at the top level
  const constMatch = line.match(/^(const|let|var)\s+(\w+)\s*=/);
  if (constMatch) {
    const varName = constMatch[2];
    if (seenConstants.has(varName)) {
      console.log(`  🟠️  Skipping duplicate const: ${varName}`);
      continue;
    }
    seenConstants.add(varName);
  }
  
  outputLines.push(line);
}

// Write the fixed content
fs.writeFileSync(filePath, outputLines.join('\n'));

console.log('\n🏁 Fixed specialist consolidation issues');
console.log(`  Classes: ${seenClasses.size}`);
console.log(`  Functions: ${seenFunctions.size}`);
console.log(`  Constants: ${seenConstants.size}`);