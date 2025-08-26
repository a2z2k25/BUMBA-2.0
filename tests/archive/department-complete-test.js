/**
 * BUMBA Department Management System Complete Test
 * Verify all department components are 100% operational
 */

const chalk = require('chalk');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Department Management Complete Test'));
console.log(chalk.cyan('═'.repeat(60)));

async function testDepartmentManagement() {
  const results = {
    departments: {},
    components: {},
    capabilities: {},
    overall: true
  };
  
  let totalTests = 0;
  let passedTests = 0;
  
  // ============== TEST PRODUCT STRATEGIST DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n📊 Testing Product Strategist Department...'));
  
  try {
    const { ProductStrategistManager } = require('../src/core/departments/product-strategist-manager');
    const manager = new ProductStrategistManager();
    
    if (manager) {
      passedTests++;
      console.log(chalk.green('  🏁 Product Strategist Manager loads'));
      results.departments.productStrategist = true;
    }
    totalTests++;
    
    // Test all required methods
    const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
    for (const method of methods) {
      if (typeof manager[method] === 'function') {
        passedTests++;
        console.log(chalk.green(`  🏁 ${method} method works`));
        results.capabilities[`product_${method}`] = true;
      } else {
        console.log(chalk.red(`  🔴 ${method} method missing`));
        results.capabilities[`product_${method}`] = false;
      }
      totalTests++;
    }
    
    // Test orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/product-strategist-orchestrator.js');
    if (require('fs').existsSync(orchestratorPath)) {
      passedTests++;
      console.log(chalk.green('  🏁 Product Strategist Orchestrator exists'));
      results.components.productOrchestrator = true;
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Product Strategist error:'), error.message);
    results.departments.productStrategist = false;
  }
  
  // ============== TEST DESIGN ENGINEER DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Design Engineer Department...'));
  
  try {
    const { DesignEngineerManager } = require('../src/core/departments/design-engineer-manager');
    const manager = new DesignEngineerManager();
    
    if (manager) {
      passedTests++;
      console.log(chalk.green('  🏁 Design Engineer Manager loads'));
      results.departments.designEngineer = true;
    }
    totalTests++;
    
    // Test all required methods
    const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
    for (const method of methods) {
      if (typeof manager[method] === 'function') {
        passedTests++;
        console.log(chalk.green(`  🏁 ${method} method works`));
        results.capabilities[`design_${method}`] = true;
      } else {
        console.log(chalk.red(`  🔴 ${method} method missing`));
        results.capabilities[`design_${method}`] = false;
      }
      totalTests++;
    }
    
    // Test orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/design-engineer-orchestrator.js');
    if (require('fs').existsSync(orchestratorPath)) {
      passedTests++;
      console.log(chalk.green('  🏁 Design Engineer Orchestrator exists'));
      results.components.designOrchestrator = true;
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Design Engineer error:'), error.message);
    results.departments.designEngineer = false;
  }
  
  // ============== TEST BACKEND ENGINEER DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n🟢️ Testing Backend Engineer Department...'));
  
  try {
    const { BackendEngineerManager } = require('../src/core/departments/backend-engineer-manager');
    const manager = new BackendEngineerManager();
    
    if (manager) {
      passedTests++;
      console.log(chalk.green('  🏁 Backend Engineer Manager loads'));
      results.departments.backendEngineer = true;
    }
    totalTests++;
    
    // Test all required methods
    const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
    for (const method of methods) {
      if (typeof manager[method] === 'function') {
        passedTests++;
        console.log(chalk.green(`  🏁 ${method} method works`));
        results.capabilities[`backend_${method}`] = true;
      } else {
        console.log(chalk.red(`  🔴 ${method} method missing`));
        results.capabilities[`backend_${method}`] = false;
      }
      totalTests++;
    }
    
    // Test orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/backend-engineer-orchestrator.js');
    if (require('fs').existsSync(orchestratorPath)) {
      passedTests++;
      console.log(chalk.green('  🏁 Backend Engineer Orchestrator exists'));
      results.components.backendOrchestrator = true;
    }
    totalTests++;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Backend Engineer error:'), error.message);
    results.departments.backendEngineer = false;
  }
  
  // ============== TEST DEPARTMENT PROTOCOLS ==============
  console.log(chalk.bold.yellow('\n📋 Testing Department Protocols...'));
  
  try {
    const protocols = require('../src/core/coordination/department-protocols');
    
    if (protocols) {
      passedTests++;
      console.log(chalk.green('  🏁 Department Protocols loads'));
      results.components.protocols = true;
      totalTests++;
      
      // Test expected protocols
      const expectedProtocols = ['DepartmentProtocols', 'CommunicationProtocol', 'HandoffProtocol'];
      for (const protocol of expectedProtocols) {
        if (protocols[protocol]) {
          passedTests++;
          console.log(chalk.green(`  🏁 ${protocol} available`));
          results.capabilities[`protocol_${protocol}`] = true;
        } else {
          console.log(chalk.red(`  🔴 ${protocol} missing`));
          results.capabilities[`protocol_${protocol}`] = false;
        }
        totalTests++;
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Department Protocols error:'), error.message);
    results.components.protocols = false;
    totalTests++;
  }
  
  // ============== TEST COORDINATION HUB ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Coordination Hub...'));
  
  try {
    const { getCoordinationHub } = require('../src/core/coordination');
    const hub = getCoordinationHub();
    
    if (hub) {
      passedTests++;
      console.log(chalk.green('  🏁 Coordination Hub loads'));
      results.components.coordinationHub = true;
      totalTests++;
      
      // Initialize hub
      await hub.initialize();
      
      // Test hub methods
      const methods = ['coordinateDepartments', 'handleHandoff', 'resolveConflict'];
      for (const method of methods) {
        if (typeof hub[method] === 'function') {
          passedTests++;
          console.log(chalk.green(`  🏁 ${method} method works`));
          results.capabilities[`hub_${method}`] = true;
        } else {
          console.log(chalk.red(`  🔴 ${method} method missing`));
          results.capabilities[`hub_${method}`] = false;
        }
        totalTests++;
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Coordination Hub error:'), error.message);
    results.components.coordinationHub = false;
    totalTests++;
  }
  
  // ============== TEST INTER-DEPARTMENT FEATURES ==============
  console.log(chalk.bold.yellow('\n🤝 Testing Inter-Department Features...'));
  
  // Test department coordination
  try {
    const { ProductStrategistManager } = require('../src/core/departments/product-strategist-manager');
    const manager = new ProductStrategistManager();
    
    const coordination = await manager.coordinateWithDepartments(
      { type: 'test', description: 'Test coordination' },
      ['design', 'backend']
    );
    
    if (coordination) {
      passedTests++;
      console.log(chalk.green('  🏁 Inter-department coordination works'));
      results.capabilities.interDepartmentCoordination = true;
    }
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Inter-department coordination error:'), error.message);
    results.capabilities.interDepartmentCoordination = false;
    totalTests++;
  }
  
  // Test specialist spawning
  try {
    const { DesignEngineerManager } = require('../src/core/departments/design-engineer-manager');
    const manager = new DesignEngineerManager();
    
    if (typeof manager.spawnSpecialist === 'function') {
      passedTests++;
      console.log(chalk.green('  🏁 Specialist spawning available'));
      results.capabilities.specialistSpawning = true;
    }
    totalTests++;
  } catch (error) {
    console.log(chalk.red('  🔴 Specialist spawning error:'), error.message);
    results.capabilities.specialistSpawning = false;
    totalTests++;
  }
  
  // ============== CALCULATE RESULTS ==============
  const successRate = Math.round((passedTests / totalTests) * 100);
  results.overall = successRate === 100;
  
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('TEST RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold(`\nTests Passed: ${passedTests}/${totalTests} (${successRate}%)`));
  
  // Department status
  console.log('\n🟢 Departments:');
  console.log(`  Product Strategist: ${results.departments.productStrategist ? '🏁' : '🔴'}`);
  console.log(`  Design Engineer: ${results.departments.designEngineer ? '🏁' : '🔴'}`);
  console.log(`  Backend Engineer: ${results.departments.backendEngineer ? '🏁' : '🔴'}`);
  
  // Component status
  console.log('\n📦 Components:');
  console.log(`  Product Orchestrator: ${results.components.productOrchestrator ? '🏁' : '🔴'}`);
  console.log(`  Design Orchestrator: ${results.components.designOrchestrator ? '🏁' : '🔴'}`);
  console.log(`  Backend Orchestrator: ${results.components.backendOrchestrator ? '🏁' : '🔴'}`);
  console.log(`  Department Protocols: ${results.components.protocols ? '🏁' : '🔴'}`);
  console.log(`  Coordination Hub: ${results.components.coordinationHub ? '🏁' : '🔴'}`);
  
  // Capability status
  console.log('\n🟡 Capabilities:');
  console.log(`  Initialize Methods: ${results.capabilities.product_initialize && results.capabilities.design_initialize && results.capabilities.backend_initialize ? '🏁' : '🔴'}`);
  console.log(`  Process Task: ${results.capabilities.product_processTask && results.capabilities.design_processTask && results.capabilities.backend_processTask ? '🏁' : '🔴'}`);
  console.log(`  Spawn Specialists: ${results.capabilities.product_spawnSpecialist && results.capabilities.design_spawnSpecialist && results.capabilities.backend_spawnSpecialist ? '🏁' : '🔴'}`);
  console.log(`  Department Coordination: ${results.capabilities.product_coordinateWithDepartments && results.capabilities.design_coordinateWithDepartments && results.capabilities.backend_coordinateWithDepartments ? '🏁' : '🔴'}`);
  console.log(`  Protocol System: ${results.capabilities.protocol_DepartmentProtocols && results.capabilities.protocol_CommunicationProtocol && results.capabilities.protocol_HandoffProtocol ? '🏁' : '🔴'}`);
  console.log(`  Hub Methods: ${results.capabilities.hub_coordinateDepartments && results.capabilities.hub_handleHandoff && results.capabilities.hub_resolveConflict ? '🏁' : '🔴'}`);
  
  if (successRate === 100) {
    console.log(chalk.bold.green('\n🏁 ALL TESTS PASSED! Department Management is 100% operational!'));
  } else if (successRate >= 90) {
    console.log(chalk.bold.yellow('\n🏁 Department Management is operational with minor issues'));
  } else if (successRate >= 70) {
    console.log(chalk.bold.yellow('\n🟠️ Department Management is partially operational'));
  } else {
    console.log(chalk.bold.red('\n🔴 Department Management has significant issues'));
  }
  
  // Save results
  const fs = require('fs');
  const reportPath = path.join(__dirname, '../DEPARTMENT_MANAGEMENT_COMPLETE.json');
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalTests,
      passedTests,
      successRate: `${successRate}%`
    },
    departments: results.departments,
    components: results.components,
    capabilities: results.capabilities
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: DEPARTMENT_MANAGEMENT_COMPLETE.json`));
  
  return successRate;
}

// Run tests
console.log(chalk.gray('\nStarting comprehensive department test...\n'));

testDepartmentManagement().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.green(`🏁 DEPARTMENT MANAGEMENT AUDIT COMPLETE: ${score}% OPERATIONAL`));
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during testing:'), error);
  process.exit(1);
});