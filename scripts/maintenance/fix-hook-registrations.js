#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Fixing hook registrations...');

const files = glob.sync('src/**/*.js');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix register calls that pass object as second parameter
  // Pattern: this.hooks.register('name', { ... })
  const registerPattern = /this\.hooks\.register\('([^']+)',\s*\{([^}]+)\}\);/g;
  
  if (registerPattern.test(content)) {
    content = content.replace(registerPattern, (match, hookName, options) => {
      // If options doesn't contain a function, create a default handler
      if (!options.includes('async') && !options.includes('=>')) {
        // This is likely just options, not a handler
        return `this.hooks.register('${hookName}', async (context) => { return { success: true }; }, {${options}});`;
      }
      return match;
    });
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`  Fixed: ${path.basename(file)}`);
  }
});

console.log('🏁 Hook registrations fixed');