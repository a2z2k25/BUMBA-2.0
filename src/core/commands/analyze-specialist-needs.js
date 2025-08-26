#!/usr/bin/env node

/**
 * Analyze Specialist Needs
 * Identify all unique specialists required across commands
 */

const { COMMAND_CATALOG } = require('./command-catalog');

function analyzeSpecialistNeeds() {
  console.log('='.repeat(80));
  console.log('📊 SPECIALIST NEEDS ANALYSIS');
  console.log('='.repeat(80));
  
  // Collect all unique specialists
  const specialistUsage = new Map();
  const departmentCommands = new Map();
  
  // Analyze each command
  Object.entries(COMMAND_CATALOG).forEach(([cmdName, cmdDef]) => {
    // Track department usage
    if (!departmentCommands.has(cmdDef.department)) {
      departmentCommands.set(cmdDef.department, []);
    }
    departmentCommands.get(cmdDef.department).push(cmdName);
    
    // Track specialist usage
    cmdDef.specialists.forEach(specialist => {
      if (!specialistUsage.has(specialist)) {
        specialistUsage.set(specialist, {
          commands: [],
          departments: new Set(),
          count: 0
        });
      }
      
      const usage = specialistUsage.get(specialist);
      usage.commands.push(cmdName);
      usage.departments.add(cmdDef.department);
      usage.count++;
    });
  });
  
  // Sort specialists by usage frequency
  const sortedSpecialists = Array.from(specialistUsage.entries())
    .sort((a, b) => b[1].count - a[1].count);
  
  console.log('\n📋 UNIQUE SPECIALISTS REQUIRED:');
  console.log('-'.repeat(60));
  console.log(`Total unique specialists: ${specialistUsage.size}`);
  console.log(`Total commands: ${Object.keys(COMMAND_CATALOG).length}`);
  
  console.log('\n🔥 TOP 20 MOST USED SPECIALISTS:');
  console.log('-'.repeat(60));
  sortedSpecialists.slice(0, 20).forEach(([specialist, usage]) => {
    console.log(`${specialist.padEnd(25)} - Used ${usage.count}x in ${usage.commands.length} commands`);
  });
  
  console.log('\n🟢 SPECIALISTS BY DEPARTMENT:');
  console.log('-'.repeat(60));
  
  // Group specialists by their primary department
  const departmentSpecialists = {
    backend: [],
    frontend: [],
    product: [],
    'cross-functional': []
  };
  
  sortedSpecialists.forEach(([specialist, usage]) => {
    // Determine primary department
    let primaryDept = 'cross-functional';
    if (usage.departments.size === 1) {
      primaryDept = Array.from(usage.departments)[0];
    }
    
    if (!departmentSpecialists[primaryDept]) {
      departmentSpecialists[primaryDept] = [];
    }
    departmentSpecialists[primaryDept].push(specialist);
  });
  
  Object.entries(departmentSpecialists).forEach(([dept, specialists]) => {
    console.log(`\n${dept.toUpperCase()} (${specialists.length} specialists):`);
    specialists.forEach(s => console.log(`  - ${s}`));
  });
  
  console.log('\n📌 SPECIALISTS ALREADY CONNECTED (Sprint 1.5):');
  console.log('-'.repeat(60));
  const connected = [
    'api-architect',
    'backend-developer',
    'ui-designer',
    'ux-specialist',
    'frontend-developer',
    'product-owner',
    'business-analyst',
    'market-researcher'
  ];
  connected.forEach(s => console.log(`🏁 ${s}`));
  
  console.log('\n🟠️ SPECIALISTS NEEDING CONNECTION:');
  console.log('-'.repeat(60));
  const needConnection = [];
  sortedSpecialists.forEach(([specialist]) => {
    if (!connected.includes(specialist)) {
      needConnection.push(specialist);
    }
  });
  
  console.log(`Total to connect: ${needConnection.length}`);
  needConnection.slice(0, 20).forEach(s => console.log(`🔴 ${s}`));
  
  console.log('\n🟡 SPRINT 2 PRIORITY SPECIALISTS (Next 12):');
  console.log('-'.repeat(60));
  const sprint2Priority = needConnection.slice(0, 12);
  sprint2Priority.forEach(s => {
    const usage = specialistUsage.get(s);
    console.log(`${s.padEnd(25)} - Needed by ${usage.count} commands`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  return {
    total: specialistUsage.size,
    connected: connected.length,
    remaining: needConnection.length,
    sprint2: sprint2Priority
  };
}

// Run analysis
if (require.main === module) {
  analyzeSpecialistNeeds();
}

module.exports = { analyzeSpecialistNeeds };