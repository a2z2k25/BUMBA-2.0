#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Fixing hook method names...');

const files = glob.sync('src/**/*.js');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix registerHook to register
  if (content.includes('.registerHook(')) {
    content = content.replace(/\.registerHook\(/g, '.register(');
    modified = true;
  }
  
  // Fix executeHook to execute
  if (content.includes('.executeHook(')) {
    content = content.replace(/\.executeHook\(/g, '.execute(');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`  Fixed: ${path.basename(file)}`);
  }
});

console.log('🏁 Hook methods fixed');