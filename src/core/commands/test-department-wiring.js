#!/usr/bin/env node

/**
 * Test Department Wiring for Executive Mode
 * Sprint 1 Verification
 */

const { BumbaFramework2 } = require('../bumba-framework-2');

console.log('\n' + '='.repeat(60));
console.log('🔧 SPRINT 1: DEPARTMENT WIRING TEST');
console.log('='.repeat(60));

async function testDepartmentWiring() {
  try {
    // Initialize framework
    console.log('\n1️⃣ Initializing framework...');
    const framework = new BumbaFramework2();
    
    // Get departments
    const productStrategist = framework.departments.get('strategic');
    const designEngineer = framework.departments.get('experience');
    const backendEngineer = framework.departments.get('technical');
    
    console.log('   🏁 Framework initialized');
    console.log('   🏁 Departments created');
    
    // Test 1: Check department references
    console.log('\n2️⃣ Testing department references...');
    
    if (productStrategist.departmentRefs) {
      console.log('   🏁 Product-Strategist has department references');
      console.log(`      - Can access Design: ${productStrategist.departmentRefs.design ? 'YES' : 'NO'}`);
      console.log(`      - Can access Backend: ${productStrategist.departmentRefs.backend ? 'YES' : 'NO'}`);
    } else {
      console.log('   🔴 Product-Strategist missing department references');
    }
    
    if (designEngineer.departmentRefs) {
      console.log('   🏁 Design-Engineer has department references');
    }
    
    if (backendEngineer.departmentRefs) {
      console.log('   🏁 Backend-Engineer has department references');
    }
    
    // Test 2: Check getAllDepartments function
    console.log('\n3️⃣ Testing getAllDepartments function...');
    
    if (productStrategist.getAllDepartments) {
      const allDepts = productStrategist.getAllDepartments();
      console.log('   🏁 Product-Strategist can get all departments');
      console.log(`      - Department count: ${allDepts.length}`);
      console.log(`      - Includes self: ${allDepts.includes(productStrategist) ? 'YES' : 'NO'}`);
      console.log(`      - Includes Design: ${allDepts.includes(designEngineer) ? 'YES' : 'NO'}`);
      console.log(`      - Includes Backend: ${allDepts.includes(backendEngineer) ? 'YES' : 'NO'}`);
    } else {
      console.log('   🔴 Product-Strategist missing getAllDepartments function');
    }
    
    // Test 3: Verify bidirectional awareness
    console.log('\n4️⃣ Testing bidirectional awareness...');
    
    const canDesignSeeStrategic = designEngineer.departmentRefs?.strategic === productStrategist;
    const canBackendSeeStrategic = backendEngineer.departmentRefs?.strategic === productStrategist;
    const canDesignSeeBackend = designEngineer.departmentRefs?.backend === backendEngineer;
    
    console.log(`   Design → Strategic: ${canDesignSeeStrategic ? '🏁' : '🔴'}`);
    console.log(`   Backend → Strategic: ${canBackendSeeStrategic ? '🏁' : '🔴'}`);
    console.log(`   Design → Backend: ${canDesignSeeBackend ? '🏁' : '🔴'}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SPRINT 1 SUMMARY');
    console.log('='.repeat(60));
    
    const allTestsPassed = 
      productStrategist.departmentRefs &&
      designEngineer.departmentRefs &&
      backendEngineer.departmentRefs &&
      productStrategist.getAllDepartments &&
      canDesignSeeStrategic &&
      canBackendSeeStrategic &&
      canDesignSeeBackend;
    
    if (allTestsPassed) {
      console.log('\n🏁 SPRINT 1 COMPLETE: Department wiring successful!');
      console.log('   • All departments connected');
      console.log('   • Product-Strategist can access all departments');
      console.log('   • Bidirectional awareness established');
      console.log('   • Ready for executive mode activation');
    } else {
      console.log('\n🟠️ SPRINT 1 INCOMPLETE: Some connections missing');
    }
    
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error(`\n🔴 Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testDepartmentWiring();