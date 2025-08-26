#!/usr/bin/env node

/**
 * Test if department managers actually have orchestration capabilities
 */

console.log('\n🟢 Testing Department Manager Orchestration Capabilities\n');
console.log('=' .repeat(60));

async function testDepartments() {
  const results = {
    productStrategist: { enhanced: false, methods: [] },
    designEngineer: { enhanced: false, methods: [] },
    backendEngineer: { enhanced: false, methods: [] }
  };
  
  // Test Product-Strategist
  console.log('\n1️⃣ Testing Product-Strategist Manager:');
  try {
    const ProductStrategist = require('./src/core/departments/product-strategist-manager');
    const instance = new ProductStrategist();
    
    const orchestrationMethods = [
      'initializeOrchestration',
      'orchestrateProject',
      'updateNotionSprintCompletion',
      'validateAllocation',
      'checkDependentTasks'
    ];
    
    orchestrationMethods.forEach(method => {
      const hasMethod = typeof instance[method] === 'function';
      console.log(`   ${hasMethod ? '🏁' : '🔴'} ${method}: ${hasMethod ? 'EXISTS' : 'MISSING'}`);
      if (hasMethod) results.productStrategist.methods.push(method);
    });
    
    results.productStrategist.enhanced = results.productStrategist.methods.length > 0;
    
  } catch (error) {
    console.log(`   🔴 ERROR: ${error.message}`);
  }
  
  // Test Design-Engineer
  console.log('\n2️⃣ Testing Design-Engineer Manager:');
  try {
    const DesignEngineer = require('./src/core/departments/design-engineer-manager');
    const instance = new DesignEngineer();
    
    const orchestrationMethods = [
      'initializeDesignOrchestration',
      'orchestrateDesignRequest',
      'onWireframeCompleted',
      'onMockupCompleted',
      'syncFigmaToNotion'
    ];
    
    orchestrationMethods.forEach(method => {
      const hasMethod = typeof instance[method] === 'function';
      console.log(`   ${hasMethod ? '🏁' : '🔴'} ${method}: ${hasMethod ? 'EXISTS' : 'MISSING'}`);
      if (hasMethod) results.designEngineer.methods.push(method);
    });
    
    results.designEngineer.enhanced = results.designEngineer.methods.length > 0;
    
  } catch (error) {
    console.log(`   🔴 ERROR: ${error.message}`);
  }
  
  // Test Backend-Engineer
  console.log('\n3️⃣ Testing Backend-Engineer Manager:');
  try {
    const BackendEngineer = require('./src/core/departments/backend-engineer-manager');
    const instance = new BackendEngineer();
    
    const orchestrationMethods = [
      'initializeBackendOrchestration',
      'orchestrateBackendRequest',
      'onAPICreated',
      'onDatabaseMigrated',
      'onDeploymentCompleted'
    ];
    
    orchestrationMethods.forEach(method => {
      const hasMethod = typeof instance[method] === 'function';
      console.log(`   ${hasMethod ? '🏁' : '🔴'} ${method}: ${hasMethod ? 'EXISTS' : 'MISSING'}`);
      if (hasMethod) results.backendEngineer.methods.push(method);
    });
    
    results.backendEngineer.enhanced = results.backendEngineer.methods.length > 0;
    
  } catch (error) {
    console.log(`   🔴 ERROR: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n🟢 ORCHESTRATION CAPABILITY SUMMARY:\n');
  
  const totalDepts = 3;
  const enhancedDepts = [
    results.productStrategist.enhanced,
    results.designEngineer.enhanced,
    results.backendEngineer.enhanced
  ].filter(Boolean).length;
  
  console.log(`Department Managers Enhanced: ${enhancedDepts}/${totalDepts}`);
  console.log('');
  
  console.log(`Product-Strategist: ${results.productStrategist.enhanced ? '🏁 ORCHESTRATED' : '🔴 NOT ORCHESTRATED'}`);
  if (results.productStrategist.enhanced) {
    console.log(`  • ${results.productStrategist.methods.length} orchestration methods available`);
  }
  
  console.log(`Design-Engineer: ${results.designEngineer.enhanced ? '🏁 ORCHESTRATED' : '🔴 NOT ORCHESTRATED'}`);
  if (results.designEngineer.enhanced) {
    console.log(`  • ${results.designEngineer.methods.length} orchestration methods available`);
  }
  
  console.log(`Backend-Engineer: ${results.backendEngineer.enhanced ? '🏁 ORCHESTRATED' : '🔴 NOT ORCHESTRATED'}`);
  if (results.backendEngineer.enhanced) {
    console.log(`  • ${results.backendEngineer.methods.length} orchestration methods available`);
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (enhancedDepts === totalDepts) {
    console.log('\n🏁 ALL DEPARTMENT MANAGERS ARE ORCHESTRATION-ENABLED!\n');
  } else if (enhancedDepts > 0) {
    console.log(`\n🟡 PARTIAL SUCCESS: ${enhancedDepts}/${totalDepts} departments orchestrated\n`);
  } else {
    console.log('\n🔴 NO DEPARTMENT MANAGERS ARE ORCHESTRATION-ENABLED\n');
  }
}

testDepartments().catch(console.error);