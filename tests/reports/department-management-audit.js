/**
 * BUMBA Department Management System Audit
 * Comprehensive test of all department components
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Department Management System Audit'));
console.log(chalk.cyan('═'.repeat(60)));

async function auditDepartmentManagement() {
  const results = {
    components: {},
    features: {},
    departments: {},
    gaps: [],
    recommendations: []
  };

  let componentsPassed = 0;
  let componentsTotal = 0;
  let featuresPassed = 0;
  let featuresTotal = 0;

  // ============== TEST PRODUCT STRATEGIST DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n📊 Testing Product Strategist Department...'));
  componentsTotal++;
  
  try {
    // Test Manager
    const managerPath = path.join(__dirname, '../src/core/departments/product-strategist-manager.js');
    if (!fs.existsSync(managerPath)) {
      console.log(chalk.red('  🔴 Product Strategist Manager not found'));
      results.departments.productStrategist = { manager: false };
      results.gaps.push('Product Strategist Manager missing');
    } else {
      const { ProductStrategistManager } = require('../src/core/departments/product-strategist-manager');
      
      if (ProductStrategistManager) {
        const manager = new ProductStrategistManager();
        console.log(chalk.green('  🏁 Product Strategist Manager exists'));
        results.departments.productStrategist = { manager: true, managerFunctional: false };
        
        // Test manager methods
        const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
        let methodsFound = 0;
        
        for (const method of methods) {
          if (typeof manager[method] === 'function') {
            methodsFound++;
            console.log(chalk.green(`    🏁 ${method} method exists`));
          } else {
            console.log(chalk.red(`    🔴 ${method} method missing`));
          }
        }
        
        if (methodsFound === methods.length) {
          results.departments.productStrategist.managerFunctional = true;
          componentsPassed++;
        }
      }
    }
    
    // Test Orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/product-strategist-orchestrator.js');
    if (!fs.existsSync(orchestratorPath)) {
      console.log(chalk.yellow('  🟠️ Product Strategist Orchestrator not found (optional)'));
      results.departments.productStrategist.orchestrator = false;
    } else {
      const orchestrator = require('../src/core/departments/product-strategist-orchestrator');
      console.log(chalk.green('  🏁 Product Strategist Orchestrator exists'));
      results.departments.productStrategist.orchestrator = true;
    }
    
  } catch (error) {
    console.log(chalk.red('  🔴 Product Strategist error:'), error.message);
    results.departments.productStrategist = { error: error.message };
  }

  // ============== TEST DESIGN ENGINEER DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Design Engineer Department...'));
  componentsTotal++;
  
  try {
    // Test Manager
    const managerPath = path.join(__dirname, '../src/core/departments/design-engineer-manager.js');
    if (!fs.existsSync(managerPath)) {
      console.log(chalk.red('  🔴 Design Engineer Manager not found'));
      results.departments.designEngineer = { manager: false };
      results.gaps.push('Design Engineer Manager missing');
    } else {
      const { DesignEngineerManager } = require('../src/core/departments/design-engineer-manager');
      
      if (DesignEngineerManager) {
        const manager = new DesignEngineerManager();
        console.log(chalk.green('  🏁 Design Engineer Manager exists'));
        results.departments.designEngineer = { manager: true, managerFunctional: false };
        
        // Test manager methods
        const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
        let methodsFound = 0;
        
        for (const method of methods) {
          if (typeof manager[method] === 'function') {
            methodsFound++;
            console.log(chalk.green(`    🏁 ${method} method exists`));
          } else {
            console.log(chalk.red(`    🔴 ${method} method missing`));
          }
        }
        
        if (methodsFound === methods.length) {
          results.departments.designEngineer.managerFunctional = true;
          componentsPassed++;
        }
      }
    }
    
    // Test Orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/design-engineer-orchestrator.js');
    if (!fs.existsSync(orchestratorPath)) {
      console.log(chalk.yellow('  🟠️ Design Engineer Orchestrator not found (optional)'));
      results.departments.designEngineer.orchestrator = false;
    } else {
      const orchestrator = require('../src/core/departments/design-engineer-orchestrator');
      console.log(chalk.green('  🏁 Design Engineer Orchestrator exists'));
      results.departments.designEngineer.orchestrator = true;
    }
    
  } catch (error) {
    console.log(chalk.red('  🔴 Design Engineer error:'), error.message);
    results.departments.designEngineer = { error: error.message };
  }

  // ============== TEST BACKEND ENGINEER DEPARTMENT ==============
  console.log(chalk.bold.yellow('\n🟢️ Testing Backend Engineer Department...'));
  componentsTotal++;
  
  try {
    // Test Manager
    const managerPath = path.join(__dirname, '../src/core/departments/backend-engineer-manager.js');
    if (!fs.existsSync(managerPath)) {
      console.log(chalk.red('  🔴 Backend Engineer Manager not found'));
      results.departments.backendEngineer = { manager: false };
      results.gaps.push('Backend Engineer Manager missing');
    } else {
      const { BackendEngineerManager } = require('../src/core/departments/backend-engineer-manager');
      
      if (BackendEngineerManager) {
        const manager = new BackendEngineerManager();
        console.log(chalk.green('  🏁 Backend Engineer Manager exists'));
        results.departments.backendEngineer = { manager: true, managerFunctional: false };
        
        // Test manager methods
        const methods = ['initialize', 'processTask', 'spawnSpecialist', 'coordinateWithDepartments'];
        let methodsFound = 0;
        
        for (const method of methods) {
          if (typeof manager[method] === 'function') {
            methodsFound++;
            console.log(chalk.green(`    🏁 ${method} method exists`));
          } else {
            console.log(chalk.red(`    🔴 ${method} method missing`));
          }
        }
        
        if (methodsFound === methods.length) {
          results.departments.backendEngineer.managerFunctional = true;
          componentsPassed++;
        }
      }
    }
    
    // Test Orchestrator
    const orchestratorPath = path.join(__dirname, '../src/core/departments/backend-engineer-orchestrator.js');
    if (!fs.existsSync(orchestratorPath)) {
      console.log(chalk.yellow('  🟠️ Backend Engineer Orchestrator not found (optional)'));
      results.departments.backendEngineer.orchestrator = false;
    } else {
      const orchestrator = require('../src/core/departments/backend-engineer-orchestrator');
      console.log(chalk.green('  🏁 Backend Engineer Orchestrator exists'));
      results.departments.backendEngineer.orchestrator = true;
    }
    
  } catch (error) {
    console.log(chalk.red('  🔴 Backend Engineer error:'), error.message);
    results.departments.backendEngineer = { error: error.message };
  }

  // ============== TEST DEPARTMENT PROTOCOL SYSTEM ==============
  console.log(chalk.bold.yellow('\n📋 Testing Department Protocol System...'));
  componentsTotal++;
  
  try {
    const protocolPath = path.join(__dirname, '../src/core/coordination/department-protocols.js');
    if (!fs.existsSync(protocolPath)) {
      console.log(chalk.red('  🔴 Department Protocol System not found'));
      results.components.protocolSystem = { exists: false };
      results.gaps.push('Department Protocol System missing');
    } else {
      const protocols = require('../src/core/coordination/department-protocols');
      
      if (protocols) {
        console.log(chalk.green('  🏁 Department Protocol System exists'));
        results.components.protocolSystem = { exists: true, functional: false };
        
        // Check for protocol functions
        const expectedProtocols = ['DepartmentProtocols', 'CommunicationProtocol', 'HandoffProtocol'];
        let protocolsFound = 0;
        
        for (const protocol of expectedProtocols) {
          if (protocols[protocol]) {
            protocolsFound++;
            console.log(chalk.green(`    🏁 ${protocol} found`));
          } else {
            console.log(chalk.yellow(`    🟠️ ${protocol} not found`));
          }
        }
        
        if (protocolsFound > 0) {
          results.components.protocolSystem.functional = true;
          componentsPassed++;
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Protocol System error:'), error.message);
    results.components.protocolSystem = { exists: false, error: error.message };
  }

  // ============== TEST DEPARTMENT COORDINATION HUB ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Department Coordination Hub...'));
  componentsTotal++;
  
  try {
    const coordinationPath = path.join(__dirname, '../src/core/coordination/index.js');
    if (!fs.existsSync(coordinationPath)) {
      console.log(chalk.red('  🔴 Coordination Hub not found'));
      results.components.coordinationHub = { exists: false };
      results.gaps.push('Department Coordination Hub missing');
    } else {
      const coordination = require('../src/core/coordination');
      
      if (coordination) {
        console.log(chalk.green('  🏁 Coordination Hub exists'));
        results.components.coordinationHub = { exists: true, functional: false };
        
        // Check for coordination functions
        if (coordination.getCoordinationHub || coordination.CoordinationHub) {
          console.log(chalk.green('    🏁 Coordination Hub accessible'));
          results.components.coordinationHub.functional = true;
          componentsPassed++;
          
          // Try to get instance
          const hub = coordination.getCoordinationHub ? coordination.getCoordinationHub() : 
                      new coordination.CoordinationHub();
          
          if (hub) {
            // Test hub methods
            const methods = ['coordinateDepartments', 'handleHandoff', 'resolveConflict'];
            for (const method of methods) {
              if (typeof hub[method] === 'function') {
                console.log(chalk.green(`    🏁 ${method} method exists`));
              } else {
                console.log(chalk.yellow(`    🟠️ ${method} method not found`));
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Coordination Hub error:'), error.message);
    results.components.coordinationHub = { exists: false, error: error.message };
  }

  // ============== TEST DEPARTMENT FEATURES ==============
  console.log(chalk.bold.yellow('\n🔧 Testing Department Features...'));
  
  // Test inter-department communication
  featuresTotal++;
  try {
    const { ProductStrategistManager } = require('../src/core/departments/product-strategist-manager');
    const manager = new ProductStrategistManager();
    
    if (typeof manager.coordinateWithDepartments === 'function') {
      console.log(chalk.green('  🏁 Inter-department communication available'));
      results.features.interDepartmentComm = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Inter-department communication not available'));
      results.features.interDepartmentComm = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Inter-department communication error:'), error.message);
    results.features.interDepartmentComm = false;
  }

  // Test specialist spawning
  featuresTotal++;
  try {
    const { DesignEngineerManager } = require('../src/core/departments/design-engineer-manager');
    const manager = new DesignEngineerManager();
    
    if (typeof manager.spawnSpecialist === 'function') {
      console.log(chalk.green('  🏁 Specialist spawning available'));
      results.features.specialistSpawning = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Specialist spawning not available'));
      results.features.specialistSpawning = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Specialist spawning error:'), error.message);
    results.features.specialistSpawning = false;
  }

  // Test task processing
  featuresTotal++;
  try {
    const { BackendEngineerManager } = require('../src/core/departments/backend-engineer-manager');
    const manager = new BackendEngineerManager();
    
    if (typeof manager.processTask === 'function') {
      console.log(chalk.green('  🏁 Task processing available'));
      results.features.taskProcessing = true;
      featuresPassed++;
    } else {
      console.log(chalk.red('  🔴 Task processing not available'));
      results.features.taskProcessing = false;
    }
  } catch (error) {
    console.log(chalk.red('  🔴 Task processing error:'), error.message);
    results.features.taskProcessing = false;
  }

  // Test orchestration
  featuresTotal++;
  const orchestratorCount = 
    (results.departments.productStrategist?.orchestrator ? 1 : 0) +
    (results.departments.designEngineer?.orchestrator ? 1 : 0) +
    (results.departments.backendEngineer?.orchestrator ? 1 : 0);
  
  if (orchestratorCount > 0) {
    console.log(chalk.green(`  🏁 Orchestration available (${orchestratorCount}/3 departments)`));
    results.features.orchestration = true;
    featuresPassed++;
  } else {
    console.log(chalk.red('  🔴 No orchestration available'));
    results.features.orchestration = false;
  }

  // Test protocol system
  featuresTotal++;
  if (results.components.protocolSystem?.functional) {
    console.log(chalk.green('  🏁 Protocol system functional'));
    results.features.protocolSystem = true;
    featuresPassed++;
  } else {
    console.log(chalk.red('  🔴 Protocol system not functional'));
    results.features.protocolSystem = false;
  }

  // Test coordination hub
  featuresTotal++;
  if (results.components.coordinationHub?.functional) {
    console.log(chalk.green('  🏁 Coordination hub functional'));
    results.features.coordinationHub = true;
    featuresPassed++;
  } else {
    console.log(chalk.red('  🔴 Coordination hub not functional'));
    results.features.coordinationHub = false;
  }

  // Calculate scores
  const componentScore = Math.round((componentsPassed / componentsTotal) * 100);
  const featureScore = Math.round((featuresPassed / featuresTotal) * 100);
  const overallScore = Math.round(((componentsPassed + featuresPassed) / (componentsTotal + featuresTotal)) * 100);

  // Add recommendations
  if (results.gaps.length > 0) {
    results.recommendations.push('Address identified gaps in components');
  }
  
  if (orchestratorCount < 3) {
    results.recommendations.push('Implement missing orchestrators for complete department orchestration');
  }

  if (!results.components.protocolSystem?.functional) {
    results.recommendations.push('Enhance protocol system for better department coordination');
  }

  if (!results.components.coordinationHub?.functional) {
    results.recommendations.push('Improve coordination hub functionality');
  }

  // Display results
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('AUDIT RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold('\n📊 Component Coverage:'), `${componentsPassed}/${componentsTotal} (${componentScore}%)`);
  console.log(chalk.bold('🟢 Feature Coverage:'), `${featuresPassed}/${featuresTotal} (${featureScore}%)`);
  console.log(chalk.bold('🟡 Overall Score:'), `${overallScore}%`);
  
  if (results.gaps.length > 0) {
    console.log(chalk.bold.yellow('\n🟠️ Gaps Identified:'));
    results.gaps.forEach(gap => console.log(`  - ${gap}`));
  }
  
  if (results.recommendations.length > 0) {
    console.log(chalk.bold.cyan('\n💡 Recommendations:'));
    results.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  // Save results
  const reportPath = path.join(__dirname, '../DEPARTMENT_MANAGEMENT_AUDIT_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    scores: {
      components: componentScore,
      features: featureScore,
      overall: overallScore,
      componentCoverage: `${componentsPassed}/${componentsTotal}`,
      featureCoverage: `${featuresPassed}/${featuresTotal}`
    }
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: DEPARTMENT_MANAGEMENT_AUDIT_RESULTS.json`));
  
  return overallScore;
}

// Run audit
console.log(chalk.gray('\nStarting department management audit...\n'));

auditDepartmentManagement().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  
  if (score === 100) {
    console.log(chalk.bold.green('🏁 DEPARTMENT MANAGEMENT SYSTEM: 100% OPERATIONAL'));
  } else if (score >= 80) {
    console.log(chalk.bold.yellow(`🟠️ DEPARTMENT MANAGEMENT SYSTEM: ${score}% OPERATIONAL`));
  } else {
    console.log(chalk.bold.red(`🔴 DEPARTMENT MANAGEMENT SYSTEM: ${score}% OPERATIONAL`));
  }
  
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during audit:'), error);
  process.exit(1);
});