#!/usr/bin/env node

/**
 * Update import paths for consolidated modules
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Updating import paths...\n');

// Import mappings
const mappings = [
  // Hook system
  { 
    from: /require\(['"]\.\.\/hooks\/[^'"]+['"]\)/g,
    to: "require('../unified-hook-system')"
  },
  { 
    from: /require\(['"]\.\.\/\.\.\/hooks\/[^'"]+['"]\)/g,
    to: "require('../../unified-hook-system')"
  },
  { 
    from: /require\(['"]\.\/hooks\/[^'"]+['"]\)/g,
    to: "require('./unified-hook-system')"
  },
  
  // Monitoring system
  { 
    from: /require\(['"]\.\.\/monitoring\/[^'"]+['"]\)/g,
    to: "require('../unified-monitoring-system')"
  },
  { 
    from: /require\(['"]\.\.\/\.\.\/monitoring\/[^'"]+['"]\)/g,
    to: "require('../../unified-monitoring-system')"
  },
  { 
    from: /require\(['"]\.\/monitoring\/[^'"]+['"]\)/g,
    to: "require('./unified-monitoring-system')"
  },
  
  // Specialists
  { 
    from: /require\(['"]\.\.\/specialists\/strategic\/[^'"]+['"]\)/g,
    to: "require('../specialists/strategic-specialists')"
  },
  { 
    from: /require\(['"]\.\.\/specialists\/technical\/[^'"]+['"]\)/g,
    to: "require('../specialists/technical-specialists')"
  },
  { 
    from: /require\(['"]\.\.\/specialists\/experience\/[^'"]+['"]\)/g,
    to: "require('../specialists/experience-specialists')"
  },
  { 
    from: /require\(['"]\.\.\/specialists\/database\/[^'"]+['"]\)/g,
    to: "require('../specialists/database-specialists')"
  }
];

// Get all JS files
const files = glob.sync('src/**/*.js');

let totalUpdates = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;
  
  mappings.forEach(mapping => {
    const matches = content.match(mapping.from);
    if (matches) {
      content = content.replace(mapping.from, mapping.to);
      updated = true;
      totalUpdates += matches.length;
      console.log(`  🏁 Updated ${matches.length} imports in ${path.relative('src', file)}`);
    }
  });
  
  if (updated) {
    fs.writeFileSync(file, content);
  }
});

console.log(`\n🏁 Updated ${totalUpdates} import statements`);
console.log('🟡 Import path update complete!');