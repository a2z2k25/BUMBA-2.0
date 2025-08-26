#!/usr/bin/env node

/**
 * Fix all duplicate declarations in consolidated files
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/core/specialists/database-specialists.js',
  'src/core/specialists/experience-specialists.js', 
  'src/core/specialists/strategic-specialists.js',
  'src/core/specialists/technical-specialists.js'
];

files.forEach(file => {
  console.log(`Fixing ${path.basename(file)}...`);
  
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const seen = new Set();
  const output = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for duplicate class/const/function declarations
    const classMatch = line.match(/^class\s+(\w+)/);
    const constMatch = line.match(/^const\s+(\w+)\s*=/);
    const funcMatch = line.match(/^function\s+(\w+)/);
    
    let identifier = null;
    if (classMatch) identifier = classMatch[1];
    else if (constMatch) identifier = constMatch[1];
    else if (funcMatch) identifier = funcMatch[1];
    
    if (identifier) {
      if (seen.has(identifier)) {
        console.log(`  Removing duplicate: ${identifier}`);
        // Skip this declaration
        if (classMatch || funcMatch) {
          // Skip until closing brace
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
        }
        continue;
      }
      seen.add(identifier);
    }
    
    output.push(line);
  }
  
  fs.writeFileSync(file, output.join('\n'));
  console.log(`  Fixed ${file}`);
});