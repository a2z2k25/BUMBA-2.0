#!/usr/bin/env node

/**
 * Update Department Manager Spawn Messaging
 * Adds color-coded spawn messages to all department managers
 */

const fs = require('fs');
const path = require('path');

// Department color mappings
const departmentColors = {
  'product-strategist-manager': { color: 'yellow', emoji: '🟡', department: 'strategic' },
  'backend-engineer-manager': { color: 'green', emoji: '🟢', department: 'technical' },
  'design-engineer-manager': { color: 'red', emoji: '🔴', department: 'experience' },
  'model-aware-department-manager': { color: 'green', emoji: '🟢', department: 'base' }, // Base class
  'department-manager-enhanced': { color: 'green', emoji: '🟢', department: 'base' } // Base class
};

function updateDepartmentManager(filePath, managerType) {
  const config = departmentColors[managerType];
  if (!config) {
    console.log(`   Skipping unknown manager: ${managerType}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Check if chalk is already imported
  if (!content.includes("require('chalk')") && !content.includes('require("chalk")')) {
    // Add chalk import after the first require statement
    const firstRequireMatch = content.match(/const .* = require\([^)]+\);/);
    if (firstRequireMatch) {
      const insertPosition = content.indexOf(firstRequireMatch[0]) + firstRequireMatch[0].length;
      const chalkImport = "\nconst chalk = require('chalk');";
      
      // Only add if not already present
      if (!content.includes(chalkImport.trim())) {
        content = content.slice(0, insertPosition) + chalkImport + content.slice(insertPosition);
        updated = true;
      }
    }
  }

  // Update spawn messaging in spawnSpecialist method
  const spawnLogRegex = /logger\.info\(`.*(?:Spawned|spawned).*specialist.*`\);?/g;
  const matches = content.match(spawnLogRegex);
  
  if (matches) {
    matches.forEach(match => {
      // Extract the variable names from the original log
      const specialistTypeMatch = match.match(/\$\{([^}]+)\}/g);
      
      if (specialistTypeMatch && specialistTypeMatch.length >= 1) {
        const typeVar = specialistTypeMatch[0];
        const idVar = specialistTypeMatch[1] || '${specialist.id}';
        
        // Create new colored log based on department
        let newLog;
        if (config.department === 'strategic') {
          newLog = `logger.info(chalk.yellow('${config.emoji} Spawning ' + ${typeVar.slice(2, -1)} + ' specialist: ' + ${idVar.slice(2, -1)}));`;
        } else if (config.department === 'technical') {
          newLog = `logger.info(chalk.green('${config.emoji} Spawning ' + ${typeVar.slice(2, -1)} + ' specialist: ' + ${idVar.slice(2, -1)}));`;
        } else if (config.department === 'experience') {
          newLog = `logger.info(chalk.red('${config.emoji} Spawning ' + ${typeVar.slice(2, -1)} + ' specialist: ' + ${idVar.slice(2, -1)}));`;
        } else {
          // Base class - use department-specific color if available
          newLog = `logger.info(chalk.green('🟢 Spawning ' + ${typeVar.slice(2, -1)} + ' specialist: ' + ${idVar.slice(2, -1)}));`;
        }
        
        content = content.replace(match, newLog);
        updated = true;
      }
    });
  }

  // Update any other spawn-related logs
  const otherSpawnLogs = [
    { 
      pattern: /logger\.info\(`.*🏁.*Spawned.*`\);?/g,
      replacer: (match) => {
        const parts = match.match(/\$\{([^}]+)\}/g) || [];
        if (parts.length >= 1) {
          const emoji = config.emoji;
          const color = config.color;
          return match.replace('🏁', emoji);
        }
        return match;
      }
    }
  ];

  otherSpawnLogs.forEach(({ pattern, replacer }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const replacement = replacer(match);
        if (replacement !== match) {
          content = content.replace(match, replacement);
          updated = true;
        }
      });
    }
  });

  if (updated) {
    // Write backup
    fs.writeFileSync(filePath + '.spawn-backup', fs.readFileSync(filePath, 'utf8'));
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`   🏁 Updated ${managerType}`);
    return true;
  }

  console.log(`   No updates needed for ${managerType}`);
  return false;
}

function updateSpecialistSpawner() {
  const spawnerPath = path.join(__dirname, '../src/core/spawning/specialist-spawner.js');
  
  if (!fs.existsSync(spawnerPath)) {
    console.log('   Specialist spawner not found');
    return false;
  }

  let content = fs.readFileSync(spawnerPath, 'utf8');
  let updated = false;

  // Add chalk import if not present
  if (!content.includes("require('chalk')") && !content.includes('require("chalk")')) {
    const firstRequireMatch = content.match(/const .* = require\([^)]+\);/);
    if (firstRequireMatch) {
      const insertPosition = content.indexOf(firstRequireMatch[0]) + firstRequireMatch[0].length;
      const chalkImport = "\nconst chalk = require('chalk');";
      content = content.slice(0, insertPosition) + chalkImport + content.slice(insertPosition);
      updated = true;
    }
  }

  // Update spawn log to use department colors
  const spawnLogPattern = /logger\.info\(`.*Spawning specialists.*`.*\)/;
  const spawnLogMatch = content.match(spawnLogPattern);
  
  if (spawnLogMatch) {
    const newLog = `logger.info(chalk.green('🟢 Spawning specialists for routing plan:'), {
      agentCount: execution.agents.length,
      agents: execution.agents.map(a => a.name)
    })`;
    content = content.replace(spawnLogMatch[0], newLog);
    updated = true;
  }

  // Update individual specialist spawn logs
  const individualSpawnPattern = /logger\.info\(`.*Spawned \$\{name\}.*`\)/;
  const individualMatch = content.match(individualSpawnPattern);
  
  if (individualMatch) {
    // Add department-based color logic
    const colorLogic = `
      // Get department color for spawn message
      const deptColor = mapping.department === 'strategic' ? chalk.yellow :
                       mapping.department === 'technical' ? chalk.green :
                       mapping.department === 'experience' ? chalk.red :
                       chalk.white;
      const deptEmoji = mapping.department === 'strategic' ? '🟡' :
                       mapping.department === 'technical' ? '🟢' :
                       mapping.department === 'experience' ? '🔴' :
                       '🏁';
      
      logger.info(deptColor(\`\${deptEmoji} Spawned \${name} with model \${context.model}\`));`;
    
    content = content.replace(individualMatch[0], colorLogic);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(spawnerPath + '.spawn-backup', fs.readFileSync(spawnerPath, 'utf8'));
    fs.writeFileSync(spawnerPath, content);
    console.log('   🏁 Updated specialist-spawner.js');
    return true;
  }

  console.log('   No updates needed for specialist-spawner.js');
  return false;
}

// Main execution
console.log('🟡 BUMBA Sprint 3: Department & Specialist Spawn Messaging');
console.log('==========================================================\n');

console.log('📁 Updating Department Managers...');
const departmentPath = path.join(__dirname, '../src/core/departments');
const managerFiles = fs.readdirSync(departmentPath).filter(f => f.endsWith('-manager.js'));

let updated = 0;
managerFiles.forEach(file => {
  const managerType = file.replace('.js', '');
  const filePath = path.join(departmentPath, file);
  if (updateDepartmentManager(filePath, managerType)) {
    updated++;
  }
});

console.log(`\n📁 Updating Specialist Spawner...`);
if (updateSpecialistSpawner()) {
  updated++;
}

console.log('\n========================================');
console.log('📊 Sprint 3 Task 1: Spawn Messaging Update');
console.log('========================================');
console.log(`Files Updated: ${updated}`);
console.log(`Status: ${updated > 0 ? '🏁 Complete' : '🟠 No updates needed'}`);

if (updated > 0) {
  console.log('\n🏁 Department spawn messages now use:');
  console.log('   🟡 Yellow for Strategic/Product specialists');
  console.log('   🟢 Green for Technical/Backend specialists');
  console.log('   🔴 Red for Experience/Design specialists');
}

process.exit(0);