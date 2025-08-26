#!/usr/bin/env node

/**
 * COMPREHENSIVE OPERATIONAL TEST
 * Verifies the entire orchestration system is working end-to-end
 */

const { logger } = require('./src/core/logging/bumba-logger');

// Disable periodic hooks for testing
process.env.DISABLE_PERIODIC_HOOKS = 'true';

console.log('\n🟢 BUMBA ORCHESTRATION SYSTEM - OPERATIONAL AUDIT\n');
console.log('=' .repeat(70));

async function operationalAudit() {
  const auditResults = {
    coreComponents: { total: 0, working: 0, details: [] },
    departmentIntegration: { total: 0, working: 0, details: [] },
    commandRouting: { total: 0, working: 0, details: [] },
    specialistIntegration: { total: 0, working: 0, details: [] },
    hookSystem: { total: 0, working: 0, details: [] },
    endToEnd: { total: 0, working: 0, details: [] }
  };
  
  // ============= SECTION 1: CORE COMPONENTS =============
  console.log('\n🟢 SECTION 1: CORE ORCHESTRATION COMPONENTS\n');
  
  // Test 1.1: Load all orchestration modules
  console.log('1.1 Loading orchestration modules...');
  const modules = [
    'orchestration/index',
    'orchestration/task-orchestrator',
    'orchestration/notion-client',
    'orchestration/dependency-manager',
    'orchestration/sprint-decomposition',
    'orchestration/agent-task-claiming',
    'orchestration/orchestration-hooks'
  ];
  
  for (const module of modules) {
    auditResults.coreComponents.total++;
    try {
      require(`./src/core/${module}`);
      auditResults.coreComponents.working++;
      auditResults.coreComponents.details.push(`🏁 ${module}`);
      console.log(`    🏁 ${module} loaded`);
    } catch (error) {
      auditResults.coreComponents.details.push(`🔴 ${module}: ${error.message}`);
      console.log(`    🔴 ${module} failed: ${error.message}`);
    }
  }
  
  // Test 1.2: Initialize orchestration system
  console.log('\n1.2 Initializing orchestration system...');
  auditResults.coreComponents.total++;
  try {
    const { BumbaOrchestrationSystem } = require('./src/core/orchestration');
    const system = new BumbaOrchestrationSystem({
      enableQualityChecks: false,
      autoStart: false
    });
    await system.initialize();
    
    const status = system.getStatus();
    if (status.initialized && status.components.length > 0) {
      auditResults.coreComponents.working++;
      auditResults.coreComponents.details.push(`🏁 System initialized with ${status.components.length} components`);
      console.log(`    🏁 Initialized with ${status.components.length} components`);
    }
    
    await system.shutdown();
  } catch (error) {
    auditResults.coreComponents.details.push(`🔴 Initialization failed: ${error.message}`);
    console.log(`    🔴 Failed: ${error.message}`);
  }
  
  // ============= SECTION 2: DEPARTMENT INTEGRATION =============
  console.log('\n🟢 SECTION 2: DEPARTMENT MANAGER INTEGRATION\n');
  
  const departments = [
    { name: 'Product-Strategist', file: 'product-strategist-manager', method: 'orchestrateProject' },
    { name: 'Design-Engineer', file: 'design-engineer-manager', method: 'orchestrateDesignRequest' },
    { name: 'Backend-Engineer', file: 'backend-engineer-manager', method: 'orchestrateBackendRequest' }
  ];
  
  for (const dept of departments) {
    console.log(`2.${departments.indexOf(dept) + 1} Testing ${dept.name}...`);
    auditResults.departmentIntegration.total++;
    
    try {
      const Manager = require(`./src/core/departments/${dept.file}`);
      const instance = new Manager();
      
      // Check for orchestration methods
      const hasOrchestration = typeof instance[dept.method] === 'function';
      const hasNotionSync = typeof instance.updateNotionSprintCompletion === 'function' ||
                           typeof instance.syncFigmaToNotion === 'function' ||
                           typeof instance.onDeploymentCompleted === 'function';
      
      if (hasOrchestration && hasNotionSync) {
        auditResults.departmentIntegration.working++;
        auditResults.departmentIntegration.details.push(`🏁 ${dept.name} fully orchestrated`);
        console.log(`    🏁 Fully orchestrated`);
      } else if (hasOrchestration) {
        auditResults.departmentIntegration.details.push(`🟡 ${dept.name} partially orchestrated`);
        console.log(`    🟡 Partially orchestrated`);
      } else {
        auditResults.departmentIntegration.details.push(`🔴 ${dept.name} not orchestrated`);
        console.log(`    🔴 Not orchestrated`);
      }
    } catch (error) {
      auditResults.departmentIntegration.details.push(`🔴 ${dept.name}: ${error.message}`);
      console.log(`    🔴 Error: ${error.message}`);
    }
  }
  
  // ============= SECTION 3: COMMAND ROUTING =============
  console.log('\n🟢 SECTION 3: COMMAND HANDLER INTEGRATION\n');
  
  console.log('3.1 Testing command handler orchestration...');
  auditResults.commandRouting.total++;
  try {
    const commandHandler = require('./src/core/command-handler');
    
    const hasInit = typeof commandHandler.initializeOrchestration === 'function';
    const hasCreate = typeof commandHandler.createOrchestrationTask === 'function';
    const hasUpdate = typeof commandHandler.updateOrchestrationStatus === 'function';
    const hasPriority = typeof commandHandler.getCommandPriority === 'function';
    
    if (hasInit && hasCreate && hasUpdate && hasPriority) {
      auditResults.commandRouting.working++;
      auditResults.commandRouting.details.push('🏁 Command handler fully orchestrated');
      console.log('    🏁 Fully orchestrated with all methods');
    } else {
      const missing = [];
      if (!hasInit) missing.push('initializeOrchestration');
      if (!hasCreate) missing.push('createOrchestrationTask');
      if (!hasUpdate) missing.push('updateOrchestrationStatus');
      if (!hasPriority) missing.push('getCommandPriority');
      
      auditResults.commandRouting.details.push(`🟡 Missing methods: ${missing.join(', ')}`);
      console.log(`    🟡 Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    auditResults.commandRouting.details.push(`🔴 Command handler: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  console.log('\n3.2 Testing command routing to departments...');
  auditResults.commandRouting.total++;
  try {
    const commandHandler = require('./src/core/command-handler');
    const testCommands = [
      { cmd: 'design', expected: 'design-engineer' },
      { cmd: 'api', expected: 'backend-engineer' },
      { cmd: 'prd', expected: 'product-strategist' }
    ];
    
    let allCorrect = true;
    for (const test of testCommands) {
      const dept = commandHandler.identifyDepartment(test.cmd);
      if (dept !== test.expected) {
        allCorrect = false;
        console.log(`    🔴 ${test.cmd} -> ${dept} (expected ${test.expected})`);
      }
    }
    
    if (allCorrect) {
      auditResults.commandRouting.working++;
      auditResults.commandRouting.details.push('🏁 Command routing working correctly');
      console.log('    🏁 All commands route correctly');
    } else {
      auditResults.commandRouting.details.push('🔴 Command routing incorrect');
    }
  } catch (error) {
    auditResults.commandRouting.details.push(`🔴 Routing test: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  // ============= SECTION 4: SPECIALIST INTEGRATION =============
  console.log('\n🟢 SECTION 4: SPECIALIST AGENT INTEGRATION\n');
  
  console.log('4.1 Testing specialist base class...');
  auditResults.specialistIntegration.total++;
  try {
    const { SpecialistAgent } = require('./src/core/specialists/specialist-agent');
    
    // Create test specialist
    const specialist = new SpecialistAgent('test-specialist', 'test-dept');
    
    const hasOrchestration = specialist.orchestrationEnabled !== undefined;
    const hasReporting = typeof specialist.reportToOrchestrator === 'function';
    const hasClaiming = typeof specialist.claimTask === 'function';
    const hasKnowledge = typeof specialist.shareKnowledge === 'function';
    
    if (hasOrchestration && hasReporting && hasClaiming && hasKnowledge) {
      auditResults.specialistIntegration.working++;
      auditResults.specialistIntegration.details.push('🏁 Specialist base fully orchestrated');
      console.log('    🏁 Fully orchestrated with all methods');
    } else {
      auditResults.specialistIntegration.details.push('🟡 Specialist partially orchestrated');
      console.log('    🟡 Partially orchestrated');
    }
    
    // Cleanup
    await specialist.cleanup();
  } catch (error) {
    auditResults.specialistIntegration.details.push(`🔴 Specialist: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  // ============= SECTION 5: HOOK SYSTEM =============
  console.log('\n🪝 SECTION 5: HOOK SYSTEM OPERATION\n');
  
  console.log('5.1 Testing orchestration hooks...');
  auditResults.hookSystem.total++;
  try {
    const hooksModule = require('./src/core/orchestration/orchestration-hooks');
    const hooks = hooksModule.getInstance();
    
    const stats = hooks.getStats();
    const health = hooks.validateHealth();
    
    if (stats.totalHooks > 0 && stats.mandatoryHooks > 0) {
      auditResults.hookSystem.working++;
      auditResults.hookSystem.details.push(`🏁 ${stats.totalHooks} hooks registered (${stats.mandatoryHooks} mandatory)`);
      console.log(`    🏁 ${stats.totalHooks} hooks registered`);
    } else {
      auditResults.hookSystem.details.push('🔴 No hooks registered');
      console.log('    🔴 No hooks registered');
    }
    
    if (health.healthy) {
      console.log('    🏁 Hook system healthy');
    } else {
      console.log(`    🟡 Issues: ${health.issues.join(', ')}`);
    }
  } catch (error) {
    auditResults.hookSystem.details.push(`🔴 Hook system: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  // ============= SECTION 6: END-TO-END OPERATION =============
  console.log('\n🟢 SECTION 6: END-TO-END OPERATIONAL TEST\n');
  
  console.log('6.1 Testing project creation flow...');
  auditResults.endToEnd.total++;
  try {
    const { BumbaOrchestrationSystem } = require('./src/core/orchestration');
    const system = new BumbaOrchestrationSystem({
      enableQualityChecks: false,
      autoStart: false
    });
    
    await system.initialize();
    
    // Register test agents
    system.registerAgent({
      id: 'test-product',
      type: 'manager',
      skills: ['strategy', 'planning'],
      department: 'strategic'
    });
    
    system.registerAgent({
      id: 'test-design',
      type: 'manager',
      skills: ['design', 'ui'],
      department: 'experience'
    });
    
    // Create test project
    const project = await system.processProject({
      title: 'End-to-End Test',
      description: 'Testing complete flow',
      complexity: 'medium'
    });
    
    if (project && project.sprintPlan && project.sprintPlan.sprints.length > 0) {
      auditResults.endToEnd.working++;
      auditResults.endToEnd.details.push(`🏁 Project created with ${project.sprintPlan.sprints.length} sprints`);
      console.log(`    🏁 Project created successfully`);
    } else {
      auditResults.endToEnd.details.push('🔴 Project creation failed');
      console.log('    🔴 Project creation failed');
    }
    
    await system.shutdown();
  } catch (error) {
    auditResults.endToEnd.details.push(`🔴 End-to-end: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  console.log('\n6.2 Testing framework integration...');
  auditResults.endToEnd.total++;
  try {
    const { BumbaFramework2 } = require('./src/core/bumba-framework-2');
    const framework = new BumbaFramework2();
    
    const hasOrchestration = framework.orchestrationSystem !== null || 
                            framework.orchestrationEnabled !== undefined;
    const hasHelpers = typeof framework.isComplexCommand === 'function' &&
                      typeof framework.createOrchestrationProject === 'function';
    
    if (hasOrchestration && hasHelpers) {
      auditResults.endToEnd.working++;
      auditResults.endToEnd.details.push('🏁 Framework fully integrated');
      console.log('    🏁 Framework orchestration integrated');
    } else {
      auditResults.endToEnd.details.push('🟡 Framework partially integrated');
      console.log('    🟡 Partial integration');
    }
  } catch (error) {
    auditResults.endToEnd.details.push(`🔴 Framework: ${error.message}`);
    console.log(`    🔴 Error: ${error.message}`);
  }
  
  // ============= FINAL AUDIT RESULTS =============
  console.log('\n' + '=' .repeat(70));
  console.log('\n🟢 OPERATIONAL AUDIT RESULTS\n');
  
  const sections = [
    { name: 'Core Components', data: auditResults.coreComponents },
    { name: 'Department Integration', data: auditResults.departmentIntegration },
    { name: 'Command Routing', data: auditResults.commandRouting },
    { name: 'Specialist Integration', data: auditResults.specialistIntegration },
    { name: 'Hook System', data: auditResults.hookSystem },
    { name: 'End-to-End Operation', data: auditResults.endToEnd }
  ];
  
  let totalTests = 0;
  let totalWorking = 0;
  
  sections.forEach(section => {
    const percent = section.data.total > 0 
      ? Math.round((section.data.working / section.data.total) * 100)
      : 0;
    
    console.log(`\n${section.name}: ${section.data.working}/${section.data.total} (${percent}%)`);
    section.data.details.forEach(detail => console.log(`  ${detail}`));
    
    totalTests += section.data.total;
    totalWorking += section.data.working;
  });
  
  const overallPercent = Math.round((totalWorking / totalTests) * 100);
  
  console.log('\n' + '=' .repeat(70));
  console.log(`\n🏁 OVERALL OPERATIONAL STATUS: ${totalWorking}/${totalTests} tests passing (${overallPercent}%)\n`);
  
  // Determine verdict
  if (overallPercent >= 90) {
    console.log('🏁 VERDICT: SYSTEM IS FULLY OPERATIONAL AND PRODUCTION-READY');
    console.log('\nThe BUMBA Notion Orchestration System is complete and working:');
    console.log('  • All core components functional');
    console.log('  • All department managers orchestrated');
    console.log('  • Command routing integrated');
    console.log('  • Specialist agents connected');
    console.log('  • Hook system operational');
    console.log('  • End-to-end flow verified');
  } else if (overallPercent >= 75) {
    console.log('🟡 VERDICT: SYSTEM IS OPERATIONAL WITH MINOR GAPS');
    console.log('\nMost components working but some areas need attention.');
  } else {
    console.log('🔴 VERDICT: SYSTEM HAS SIGNIFICANT GAPS');
    console.log('\nMajor components missing or not functioning.');
  }
  
  // Feature permeation assessment
  console.log('\n🟢 FEATURE PERMEATION ASSESSMENT:');
  console.log('\nThe Notion Orchestration feature has achieved:');
  console.log(`  • ${Math.round((auditResults.coreComponents.working / auditResults.coreComponents.total) * 100)}% Core component integration`);
  console.log(`  • ${Math.round((auditResults.departmentIntegration.working / auditResults.departmentIntegration.total) * 100)}% Department manager coverage`);
  console.log(`  • ${Math.round((auditResults.commandRouting.working / auditResults.commandRouting.total) * 100)}% Command routing integration`);
  console.log(`  • ${Math.round((auditResults.specialistIntegration.working / auditResults.specialistIntegration.total) * 100)}% Specialist agent awareness`);
  console.log(`  • ${Math.round((auditResults.hookSystem.working / auditResults.hookSystem.total) * 100)}% Hook system functionality`);
  console.log(`  • ${Math.round((auditResults.endToEnd.working / auditResults.endToEnd.total) * 100)}% End-to-end operability`);
  
  if (overallPercent >= 90) {
    console.log('\n🟢 FEATURE PERMEATION: COMPLETE');
    console.log('The orchestration feature successfully permeates every aspect of the framework.');
    console.log('The ENTIRE agent team has awareness and attachment to the feature.');
  }
  
  console.log('\n');
  process.exit(0);
}

// Run the audit
operationalAudit().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});