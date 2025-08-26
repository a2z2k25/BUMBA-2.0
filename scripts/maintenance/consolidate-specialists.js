#!/usr/bin/env node

/**
 * BUMBA Specialist Consolidation Script
 * Consolidates 33 specialist files into 5 main files
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Consolidating BUMBA Specialists...\n');

// Helper to read file
function readFile(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return null;
}

// Helper to extract class/exports from file
function extractExports(content, fileName) {
  const baseName = path.basename(fileName, '.js');
  const className = baseName.split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join('');
  
  return {
    className,
    content: content.replace(/module\.exports\s*=\s*{[^}]*}/g, '')
                   .replace(/module\.exports\s*=\s*\w+;?/g, '')
  };
}

// Categories to consolidate
const categories = {
  'core': [
    'enhanced-specialist-base.js',
    'simple-specialist.js', 
    'specialist-agent.js',
    'specialist-pool.js',
    'specialist-registry.js'
  ],
  'strategic': [
    'strategic/market-research-specialist.js',
    'business/product-owner.js',
    'business/project-manager.js',
    'business/technical-writer.js'
  ],
  'technical': [
    'technical/security-specialist.js',
    'technical/devops/*.js',
    'technical/languages/*.js',
    'technical/qa/*.js',
    'technical/data-ai/*.js',
    'technical/advanced/*.js'
  ],
  'experience': [
    'experience/ux-research-specialist.js',
    'frontend/react-specialist.js',
    'frontend/vue-specialist.js'
  ],
  'database': [
    'database/mongodb-specialist.js',
    'database/postgres-specialist.js'
  ]
};

// Process each category
Object.entries(categories).forEach(([category, files]) => {
  console.log(`📦 Processing ${category} specialists...`);
  
  let consolidatedContent = `/**
 * BUMBA ${category.charAt(0).toUpperCase() + category.slice(1)} Specialists
 * Consolidated specialist definitions
 * Generated: ${new Date().toISOString()}
 */

`;

  const exports = [];
  
  files.forEach(filePattern => {
    // Handle wildcards
    if (filePattern.includes('*')) {
      const dir = path.dirname(filePattern);
      const pattern = path.basename(filePattern);
      const fullDir = path.join('src/core/specialists', dir);
      
      if (fs.existsSync(fullDir)) {
        const dirFiles = fs.readdirSync(fullDir)
          .filter(f => f.endsWith('.js'));
        
        dirFiles.forEach(file => {
          const content = readFile(path.join(fullDir, file));
          if (content) {
            const extracted = extractExports(content, file);
            consolidatedContent += `\n// ======= ${file} =======\n`;
            consolidatedContent += extracted.content;
            exports.push(extracted.className);
          }
        });
      }
    } else {
      // Single file
      const fullPath = path.join('src/core/specialists', filePattern);
      const content = readFile(fullPath);
      
      if (content) {
        const extracted = extractExports(content, filePattern);
        consolidatedContent += `\n// ======= ${path.basename(filePattern)} =======\n`;
        consolidatedContent += extracted.content;
        exports.push(extracted.className);
      }
    }
  });
  
  // Add exports
  consolidatedContent += `\n\n// Consolidated exports\nmodule.exports = {\n`;
  exports.forEach(exp => {
    if (exp) {
      consolidatedContent += `  ${exp},\n`;
    }
  });
  consolidatedContent += `};\n`;
  
  // Write consolidated file
  const outputPath = path.join('src/core/specialists', `${category}-specialists.js`);
  fs.writeFileSync(outputPath, consolidatedContent);
  console.log(`  🏁 Created ${outputPath}`);
});

console.log('\n🟡 Specialist consolidation complete!');