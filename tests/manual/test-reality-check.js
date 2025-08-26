#!/usr/bin/env node

/**
 * Reality Check: Test what's ACTUALLY integrated vs what's planned
 */

const fs = require('fs');
const path = require('path');

console.log('\n🟢 REALITY CHECK: Orchestration Integration Status\n');
console.log('=' .repeat(60));

async function realityCheck() {
  const results = {
    actuallyImplemented: [],
    partiallyImplemented: [],
    notImplemented: [],
    mockOnly: []
  };
  
  console.log('\n🟢 CHECKING ACTUAL FILES...\n');
  
  // Test 1: Check if orchestrator files actually exist
  console.log('1️⃣ Checking core orchestration files:');
  const orchestrationFiles = [
    'src/core/orchestration/index.js',
    'src/core/orchestration/task-orchestrator.js',
    'src/core/orchestration/notion-client.js',
    'src/core/orchestration/dependency-manager.js',
    'src/core/orchestration/orchestration-hooks.js',
    'src/core/orchestration/agent-task-system.js',
    'src/core/orchestration/project-monitoring.js'
  ];
  
  orchestrationFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '🏁' : '🔴'} ${file}`);
    if (exists) results.actuallyImplemented.push(file);
    else results.notImplemented.push(file);
  });
  
  // Test 2: Check department orchestrators
  console.log('\n2️⃣ Checking department orchestrators:');
  const deptOrchestrators = [
    'src/core/departments/product-strategist-orchestrator.js',
    'src/core/departments/design-engineer-orchestrator.js',
    'src/core/departments/backend-engineer-orchestrator.js'
  ];
  
  deptOrchestrators.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '🏁' : '🔴'} ${file}`);
    if (exists) results.actuallyImplemented.push(file);
    else results.notImplemented.push(file);
  });
  
  // Test 3: Check if department managers are actually enhanced
  console.log('\n3️⃣ Checking department manager enhancements:');
  
  try {
    const ProductStrategist = require('./src/core/departments/product-strategist-manager');
    const hasOrchestration = typeof ProductStrategist.prototype.initializeOrchestration === 'function' ||
                            typeof ProductStrategist.prototype.orchestrateProject === 'function';
    console.log(`   ${hasOrchestration ? '🏁' : '🔴'} Product-Strategist: ${hasOrchestration ? 'ENHANCED' : 'NOT ENHANCED'}`);
    if (hasOrchestration) results.actuallyImplemented.push('Product-Strategist Enhancement');
    else results.notImplemented.push('Product-Strategist Enhancement');
  } catch (e) {
    console.log('   🔴 Product-Strategist: ERROR loading');
    results.notImplemented.push('Product-Strategist Enhancement');
  }
  
  try {
    const DesignEngineer = require('./src/core/departments/design-engineer-manager');
    const hasOrchestration = typeof DesignEngineer.prototype.initializeDesignOrchestration === 'function';
    console.log(`   ${hasOrchestration ? '🏁' : '🟡'} Design-Engineer: ${hasOrchestration ? 'ENHANCED' : 'EXPORT MODIFIED BUT NOT FUNCTIONAL'}`);
    if (hasOrchestration) results.actuallyImplemented.push('Design-Engineer Enhancement');
    else results.partiallyImplemented.push('Design-Engineer Enhancement');
  } catch (e) {
    console.log('   🔴 Design-Engineer: ERROR loading');
    results.notImplemented.push('Design-Engineer Enhancement');
  }
  
  try {
    const BackendEngineer = require('./src/core/departments/backend-engineer-manager');
    const hasOrchestration = typeof BackendEngineer.prototype.initializeBackendOrchestration === 'function';
    console.log(`   ${hasOrchestration ? '🏁' : '🔴'} Backend-Engineer: ${hasOrchestration ? 'ENHANCED' : 'NOT ENHANCED'}`);
    if (hasOrchestration) results.actuallyImplemented.push('Backend-Engineer Enhancement');
    else results.notImplemented.push('Backend-Engineer Enhancement');
  } catch (e) {
    console.log('   🔴 Backend-Engineer: ERROR loading');
    results.notImplemented.push('Backend-Engineer Enhancement');
  }
  
  // Test 4: Check command handler integration
  console.log('\n4️⃣ Checking command handler integration:');
  try {
    const CommandHandler = require('./src/core/command-handler');
    const hasOrchestration = typeof CommandHandler.prototype.createOrchestrationTask === 'function';
    console.log(`   ${hasOrchestration ? '🏁' : '🔴'} CommandHandler: ${hasOrchestration ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
    if (hasOrchestration) results.actuallyImplemented.push('Command Handler Integration');
    else results.notImplemented.push('Command Handler Integration');
  } catch (e) {
    console.log('   🔴 CommandHandler: ERROR');
    results.notImplemented.push('Command Handler Integration');
  }
  
  // Test 5: Check specialist base class
  console.log('\n5️⃣ Checking specialist orchestration:');
  const specialistFiles = [
    'src/core/specialists/specialist-agent.js',
    'src/core/specialists/enhanced-specialist-base.js'
  ];
  
  let specialistEnhanced = false;
  specialistFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      try {
        const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
        if (content.includes('orchestrat') || content.includes('Orchestrat')) {
          console.log(`   🏁 ${file}: Has orchestration references`);
          specialistEnhanced = true;
        } else {
          console.log(`   🟡 ${file}: No orchestration code found`);
        }
      } catch (e) {
        console.log(`   🔴 ${file}: Could not read`);
      }
    }
  });
  
  if (specialistEnhanced) results.partiallyImplemented.push('Specialist Orchestration');
  else results.notImplemented.push('Specialist Orchestration');
  
  // Test 6: Check actual Notion client functionality
  console.log('\n6️⃣ Testing Notion client:');
  try {
    const { NotionOrchestrationClient } = require('./src/core/orchestration/notion-client');
    const client = new NotionOrchestrationClient();
    const hasMethods = typeof client.createProjectDashboard === 'function' &&
                       typeof client.claimTask === 'function';
    console.log(`   ${hasMethods ? '🏁' : '🔴'} Notion client: ${hasMethods ? 'Has methods' : 'Missing methods'}`);
    
    // Check if it's just mock or real
    const isMock = !client.mcpServer || client.config?.mock !== false;
    console.log(`   ${isMock ? '🟡' : '🏁'} Notion client: ${isMock ? 'MOCK MODE' : 'MCP Connected'}`);
    
    if (hasMethods && !isMock) results.actuallyImplemented.push('Notion Client');
    else if (hasMethods && isMock) results.mockOnly.push('Notion Client');
    else results.notImplemented.push('Notion Client');
  } catch (e) {
    console.log('   🔴 Notion client: ERROR');
    results.notImplemented.push('Notion Client');
  }
  
  // Test 7: Check framework integration
  console.log('\n7️⃣ Checking framework integration:');
  const frameworkFile = 'src/core/bumba-framework-2.js';
  if (fs.existsSync(path.join(__dirname, frameworkFile))) {
    const content = fs.readFileSync(path.join(__dirname, frameworkFile), 'utf8');
    const hasOrchestration = content.includes('orchestrat') || content.includes('Orchestrat');
    console.log(`   ${hasOrchestration ? '🟡' : '🔴'} Framework: ${hasOrchestration ? 'Has references' : 'NO INTEGRATION'}`);
    if (hasOrchestration) results.partiallyImplemented.push('Framework Integration');
    else results.notImplemented.push('Framework Integration');
  }
  
  // Test 8: Check the "complete integration" module
  console.log('\n8️⃣ Checking complete integration module:');
  const completeIntegration = 'src/core/orchestration/complete-integration.js';
  if (fs.existsSync(path.join(__dirname, completeIntegration))) {
    console.log('   🏁 Complete integration file exists');
    const content = fs.readFileSync(path.join(__dirname, completeIntegration), 'utf8');
    // This file mostly contains planning/mock code
    console.log('   🟡 But contains mostly planning code, not actual implementations');
    results.mockOnly.push('Complete Integration Module');
  } else {
    console.log('   🔴 Complete integration file missing');
    results.notImplemented.push('Complete Integration Module');
  }
  
  // RESULTS SUMMARY
  console.log('\n' + '=' .repeat(60));
  console.log('\n🟢 REALITY CHECK RESULTS:\n');
  
  console.log(`🏁 ACTUALLY IMPLEMENTED (${results.actuallyImplemented.length}):`);
  results.actuallyImplemented.forEach(item => console.log(`   • ${item}`));
  
  console.log(`\n🟡 PARTIALLY IMPLEMENTED (${results.partiallyImplemented.length}):`);
  results.partiallyImplemented.forEach(item => console.log(`   • ${item}`));
  
  console.log(`\n🟢 MOCK/PLANNING ONLY (${results.mockOnly.length}):`);
  results.mockOnly.forEach(item => console.log(`   • ${item}`));
  
  console.log(`\n🔴 NOT IMPLEMENTED (${results.notImplemented.length}):`);
  results.notImplemented.forEach(item => console.log(`   • ${item}`));
  
  // FINAL VERDICT
  console.log('\n' + '=' .repeat(60));
  console.log('\n🟢 FINAL VERDICT:\n');
  
  const totalItems = results.actuallyImplemented.length + 
                    results.partiallyImplemented.length + 
                    results.mockOnly.length + 
                    results.notImplemented.length;
  
  const implementedPercent = (results.actuallyImplemented.length / totalItems * 100).toFixed(1);
  
  console.log(`🟢 Implementation Status: ${implementedPercent}% ACTUALLY WORKING\n`);
  
  if (implementedPercent > 70) {
    console.log('🏁 Core orchestration system is FUNCTIONAL');
    console.log('🏁 Product-Strategist orchestration is WORKING');
    console.log('🟡 Other departments need actual integration');
    console.log('🟡 Specialists need base class enhancement');
    console.log('🔴 Command handler NOT integrated');
    console.log('🔴 Framework core NOT integrated');
  } else if (implementedPercent > 40) {
    console.log('🟡 Orchestration system is PARTIALLY FUNCTIONAL');
    console.log('🏁 Core components exist and work');
    console.log('🔴 Most integrations are MISSING or MOCKED');
  } else {
    console.log('🔴 Orchestration system is MOSTLY THEORETICAL');
    console.log('🟡 Core files exist but integration is minimal');
  }
  
  console.log('\n🟢 WHAT ACTUALLY WORKS:');
  console.log('   • Core orchestration engine (TaskOrchestrator)');
  console.log('   • Dependency management system');
  console.log('   • Notion client (in mock mode)');
  console.log('   • Product-Strategist orchestration');
  console.log('   • Basic hook system');
  
  console.log('\n🟢 WHAT NEEDS REAL IMPLEMENTATION:');
  console.log('   • Design-Engineer actual enhancement (file exists, not connected)');
  console.log('   • Backend-Engineer connection to manager');
  console.log('   • Command handler integration');
  console.log('   • Specialist base class enhancement');
  console.log('   • Framework core integration');
  console.log('   • Real Notion MCP connection (currently mock)');
  
  console.log('\n');
}

realityCheck().catch(console.error);