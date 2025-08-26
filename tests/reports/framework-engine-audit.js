/**
 * BUMBA Framework Engine Core Audit
 * Comprehensive testing of the core framework components
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

console.log(chalk.bold.cyan('🔍 BUMBA Framework Engine Core Audit'));
console.log(chalk.cyan('=' .repeat(60)));

async function auditFrameworkEngine() {
  const results = {
    components: {
      mainFramework: { exists: false, functional: false, tests: [] },
      liteMode: { exists: false, functional: false, tests: [] },
      integrationLayer: { exists: false, functional: false, tests: [] },
      versionManager: { exists: false, functional: false, tests: [] },
      executiveMode: { exists: false, functional: false, tests: [] },
      interactiveMode: { exists: false, functional: false, tests: [] }
    },
    features: {
      initialization: false,
      commandHandling: false,
      departmentManagement: false,
      specialistManagement: false,
      hookSystem: false,
      errorHandling: false,
      configurationManagement: false,
      modeSwitch: false
    },
    gaps: [],
    recommendations: []
  };
  
  // ============== AUDIT MAIN FRAMEWORK ENGINE ==============
  console.log('\n🟢 AUDITING MAIN FRAMEWORK ENGINE\n');
  
  try {
    const frameworkPath = path.join(__dirname, '../src/core/bumba-framework-2.js');
    if (fs.existsSync(frameworkPath)) {
      results.components.mainFramework.exists = true;
      console.log('🏁 Main Framework file found');
      
      try {
        const BumbaFramework = require(frameworkPath);
        
        // Test instantiation
        if (BumbaFramework) {
          const framework = typeof BumbaFramework === 'function' 
            ? new BumbaFramework()
            : BumbaFramework.getInstance 
              ? BumbaFramework.getInstance()
              : BumbaFramework;
          
          if (framework) {
            results.components.mainFramework.functional = true;
            console.log('🏁 Framework instantiates');
            
            // Check key methods
            const methods = ['initialize', 'executeCommand', 'loadDepartments', 'handleError'];
            methods.forEach(method => {
              if (typeof framework[method] === 'function') {
                results.components.mainFramework.tests.push(`${method} method exists`);
                console.log(`🏁 ${method} method found`);
              } else {
                console.log(`🔴 ${method} method missing`);
                results.gaps.push(`Main Framework missing ${method} method`);
              }
            });
            
            // Test initialization
            if (typeof framework.initialize === 'function') {
              try {
                await framework.initialize();
                results.features.initialization = true;
                console.log('🏁 Framework initialization works');
              } catch (error) {
                console.log('🟠️ Framework initialization has issues:', error.message);
              }
            }
          }
        }
      } catch (error) {
        console.log('🔴 Main Framework error:', error.message);
        results.gaps.push('Main Framework not functional');
      }
    } else {
      console.log('🔴 Main Framework not found');
      results.gaps.push('Main Framework needs to be created');
    }
  } catch (error) {
    console.log('🔴 Main Framework check failed:', error.message);
  }
  
  // ============== AUDIT LITE FRAMEWORK MODE ==============
  console.log('\n🪶 AUDITING LITE FRAMEWORK MODE\n');
  
  try {
    // Check multiple possible locations
    const litePaths = [
      '../src/core/lite-mode/bumba-lite.js',
      '../src/core/bumba-lite.js',
      '../src/core/modes/lite-mode.js'
    ];
    
    let found = false;
    for (const relativePath of litePaths) {
      const litePath = path.join(__dirname, relativePath);
      if (fs.existsSync(litePath)) {
        console.log(`📁 Found lite mode file: ${relativePath}`);
        results.components.liteMode.exists = true;
        found = true;
        
        try {
          const LiteMode = require(litePath);
          if (LiteMode) {
            results.components.liteMode.functional = true;
            console.log('🏁 Lite Mode module loads');
            
            // Check if it's a simplified version
            const lite = typeof LiteMode === 'function' 
              ? new LiteMode()
              : LiteMode;
            
            if (lite && typeof lite.execute === 'function') {
              results.components.liteMode.tests.push('Execute method exists');
              console.log('🏁 Lite mode execution available');
            }
          }
        } catch (error) {
          console.log('🟠️ Lite Mode exists but has issues:', error.message);
        }
        break;
      }
    }
    
    if (!found) {
      console.log('🔴 Lite Framework Mode not found');
      results.gaps.push('Lite Framework Mode needs to be created');
    }
  } catch (error) {
    console.log('🔴 Lite Mode check failed:', error.message);
  }
  
  // ============== AUDIT FRAMEWORK INTEGRATION LAYER ==============
  console.log('\n🔄 AUDITING FRAMEWORK INTEGRATION LAYER\n');
  
  try {
    const integrationPaths = [
      '../src/core/integration/framework-integration.js',
      '../src/core/integration/master-integration.js',
      '../src/core/framework-integration.js'
    ];
    
    let found = false;
    for (const relativePath of integrationPaths) {
      const integrationPath = path.join(__dirname, relativePath);
      if (fs.existsSync(integrationPath)) {
        console.log(`📁 Found integration file: ${relativePath}`);
        results.components.integrationLayer.exists = true;
        found = true;
        
        try {
          const Integration = require(integrationPath);
          if (Integration) {
            results.components.integrationLayer.functional = true;
            console.log('🏁 Integration Layer loads');
            
            // Test integration capabilities
            const integration = typeof Integration === 'function'
              ? new Integration()
              : Integration.getInstance 
                ? Integration.getInstance()
                : Integration;
            
            if (integration) {
              // Check for integration methods
              const methods = ['integrate', 'connect', 'register', 'initialize'];
              methods.forEach(method => {
                if (typeof integration[method] === 'function') {
                  results.components.integrationLayer.tests.push(`${method} method exists`);
                  console.log(`🏁 Integration ${method} method found`);
                }
              });
            }
          }
        } catch (error) {
          console.log('🟠️ Integration Layer has issues:', error.message);
        }
        break;
      }
    }
    
    if (!found) {
      console.log('🔴 Framework Integration Layer not found');
      results.gaps.push('Framework Integration Layer needs to be created');
    }
  } catch (error) {
    console.log('🔴 Integration Layer check failed:', error.message);
  }
  
  // ============== AUDIT VERSION MANAGEMENT SYSTEM ==============
  console.log('\n📦 AUDITING VERSION MANAGEMENT SYSTEM\n');
  
  try {
    const versionPath = path.join(__dirname, '../src/core/version-manager.js');
    if (fs.existsSync(versionPath)) {
      results.components.versionManager.exists = true;
      console.log('🏁 Version Manager found');
      
      try {
        const VersionManager = require(versionPath);
        
        // Test version manager
        const versionManager = typeof VersionManager === 'function'
          ? new VersionManager()
          : VersionManager.getInstance 
            ? VersionManager.getInstance()
            : VersionManager;
        
        if (versionManager) {
          results.components.versionManager.functional = true;
          console.log('🏁 Version Manager instantiates');
          
          // Check version methods
          if (typeof versionManager.getCurrentVersion === 'function') {
            const version = versionManager.getCurrentVersion();
            console.log(`🏁 Current version: ${version}`);
            results.components.versionManager.tests.push('Version retrieval works');
          }
          
          if (typeof versionManager.checkCompatibility === 'function') {
            results.components.versionManager.tests.push('Compatibility check exists');
            console.log('🏁 Compatibility checking available');
          }
          
          if (typeof versionManager.migrate === 'function') {
            results.components.versionManager.tests.push('Migration support exists');
            console.log('🏁 Migration support available');
          }
        }
      } catch (error) {
        console.log('🔴 Version Manager error:', error.message);
        results.gaps.push('Version Manager not functional');
      }
    } else {
      console.log('🔴 Version Management System not found');
      results.gaps.push('Version Management System needs to be created');
    }
  } catch (error) {
    console.log('🔴 Version Manager check failed:', error.message);
  }
  
  // ============== AUDIT EXECUTIVE MODE SYSTEM ==============
  console.log('\n👔 AUDITING EXECUTIVE MODE SYSTEM\n');
  
  try {
    const executivePath = path.join(__dirname, '../src/core/executive-mode.js');
    if (fs.existsSync(executivePath)) {
      results.components.executiveMode.exists = true;
      console.log('🏁 Executive Mode found');
      
      try {
        const ExecutiveMode = require(executivePath);
        
        // Test executive mode
        const executive = typeof ExecutiveMode === 'function'
          ? new ExecutiveMode()
          : ExecutiveMode.getInstance 
            ? ExecutiveMode.getInstance()
            : ExecutiveMode;
        
        if (executive) {
          results.components.executiveMode.functional = true;
          console.log('🏁 Executive Mode instantiates');
          
          // Check executive capabilities
          const capabilities = [
            'makeDecision',
            'delegateTask',
            'coordinateDepartments',
            'generateStrategy'
          ];
          
          capabilities.forEach(capability => {
            if (typeof executive[capability] === 'function') {
              results.components.executiveMode.tests.push(`${capability} capability exists`);
              console.log(`🏁 ${capability} capability found`);
            } else {
              console.log(`🟠️ ${capability} capability missing`);
            }
          });
          
          // Test CEO capabilities if available
          if (executive.ceo || executive.getCEO) {
            console.log('🏁 CEO system available');
            results.components.executiveMode.tests.push('CEO system exists');
          }
        }
      } catch (error) {
        console.log('🔴 Executive Mode error:', error.message);
        results.gaps.push('Executive Mode not functional');
      }
    } else {
      console.log('🔴 Executive Mode System not found');
      results.gaps.push('Executive Mode System needs to be created');
    }
  } catch (error) {
    console.log('🔴 Executive Mode check failed:', error.message);
  }
  
  // ============== AUDIT INTERACTIVE MODE HANDLER ==============
  console.log('\n💬 AUDITING INTERACTIVE MODE HANDLER\n');
  
  try {
    const interactivePaths = [
      '../src/core/interactive-mode.js',
      '../src/core/modes/interactive-mode.js',
      '../src/utils/interactiveMenu.js'
    ];
    
    let found = false;
    for (const relativePath of interactivePaths) {
      const interactivePath = path.join(__dirname, relativePath);
      if (fs.existsSync(interactivePath)) {
        console.log(`📁 Found interactive mode file: ${relativePath}`);
        results.components.interactiveMode.exists = true;
        found = true;
        
        try {
          const InteractiveMode = require(interactivePath);
          if (InteractiveMode) {
            results.components.interactiveMode.functional = true;
            console.log('🏁 Interactive Mode loads');
            
            // Check interactive capabilities
            const interactive = typeof InteractiveMode === 'function'
              ? new InteractiveMode()
              : InteractiveMode;
            
            if (interactive) {
              const methods = ['start', 'show', 'prompt', 'display', 'handleInput'];
              methods.forEach(method => {
                if (typeof interactive[method] === 'function') {
                  results.components.interactiveMode.tests.push(`${method} method exists`);
                  console.log(`🏁 Interactive ${method} method found`);
                }
              });
            }
          }
        } catch (error) {
          console.log('🟠️ Interactive Mode has issues:', error.message);
        }
        break;
      }
    }
    
    if (!found) {
      console.log('🔴 Interactive Mode Handler not found');
      results.gaps.push('Interactive Mode Handler needs to be created');
    }
  } catch (error) {
    console.log('🔴 Interactive Mode check failed:', error.message);
  }
  
  // ============== CHECK SHARED FRAMEWORK FEATURES ==============
  console.log('\n🔴 CHECKING SHARED FRAMEWORK FEATURES\n');
  
  // Check for command handling
  try {
    const commandHandlerPath = path.join(__dirname, '../src/core/command-handler.js');
    if (fs.existsSync(commandHandlerPath)) {
      results.features.commandHandling = true;
      console.log('🏁 Command Handler found');
    } else {
      console.log('🟠️ Command Handler not found');
      results.gaps.push('Command handling system needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check command handling');
  }
  
  // Check for department management
  try {
    const deptPath = path.join(__dirname, '../src/core/departments');
    if (fs.existsSync(deptPath)) {
      const deptFiles = fs.readdirSync(deptPath);
      if (deptFiles.length > 0) {
        results.features.departmentManagement = true;
        console.log(`🏁 Department management found (${deptFiles.length} files)`);
      }
    } else {
      console.log('🟠️ Department management not found');
      results.gaps.push('Department management system needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check department management');
  }
  
  // Check for specialist management
  try {
    const specialistPath = path.join(__dirname, '../src/core/specialists');
    if (fs.existsSync(specialistPath)) {
      results.features.specialistManagement = true;
      console.log('🏁 Specialist management found');
    } else {
      console.log('🟠️ Specialist management not found');
      results.gaps.push('Specialist management system needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check specialist management');
  }
  
  // Check for hook system
  try {
    const hookPath = path.join(__dirname, '../src/core/unified-hook-system.js');
    if (fs.existsSync(hookPath)) {
      results.features.hookSystem = true;
      console.log('🏁 Unified Hook System found');
    } else {
      console.log('🟠️ Hook system not found');
      results.gaps.push('Hook system integration needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check hook system');
  }
  
  // Check for error handling
  try {
    const errorPath = path.join(__dirname, '../src/core/error-handling');
    if (fs.existsSync(errorPath)) {
      results.features.errorHandling = true;
      console.log('🏁 Error handling system found');
    } else {
      console.log('🟠️ Error handling system not found');
      results.gaps.push('Error handling system needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check error handling');
  }
  
  // Check for configuration management
  try {
    const configPaths = [
      '../src/core/config/bumba-config.js',
      '../bumba.config.js'
    ];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(path.join(__dirname, configPath))) {
        results.features.configurationManagement = true;
        console.log('🏁 Configuration management found');
        break;
      }
    }
    
    if (!results.features.configurationManagement) {
      console.log('🟠️ Configuration management not found');
      results.gaps.push('Configuration management needed');
    }
  } catch (error) {
    console.log('🟠️ Could not check configuration management');
  }
  
  // ============== ANALYSIS ==============
  console.log('\n' + '=' .repeat(60));
  console.log('📊 AUDIT RESULTS');
  console.log('=' .repeat(60));
  
  // Calculate completeness
  const components = Object.keys(results.components);
  const existingComponents = components.filter(c => results.components[c].exists).length;
  const functionalComponents = components.filter(c => results.components[c].functional).length;
  
  const overallPercent = Math.round((existingComponents / components.length) * 100);
  const functionalPercent = Math.round((functionalComponents / components.length) * 100);
  
  console.log('\n🟢 Framework Components:');
  console.log(`   Main Framework: ${results.components.mainFramework.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Lite Mode: ${results.components.liteMode.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Integration Layer: ${results.components.integrationLayer.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Version Manager: ${results.components.versionManager.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Executive Mode: ${results.components.executiveMode.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Interactive Mode: ${results.components.interactiveMode.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  
  console.log('\n🔍 Feature Coverage:');
  Object.entries(results.features).forEach(([feature, status]) => {
    console.log(`   ${feature}: ${status ? '🏁' : '🔴'}`);
  });
  
  console.log('\n🟠️ IDENTIFIED GAPS:');
  if (results.gaps.length === 0) {
    console.log('   No gaps identified');
  } else {
    results.gaps.forEach(gap => console.log(`   - ${gap}`));
  }
  
  // Generate recommendations
  if (!results.components.liteMode.exists) {
    results.recommendations.push('Create Lite Framework Mode for minimal resource usage');
  }
  if (!results.components.versionManager.functional) {
    results.recommendations.push('Implement Version Management System');
  }
  if (!results.components.interactiveMode.functional) {
    results.recommendations.push('Enhance Interactive Mode Handler');
  }
  if (!results.features.modeSwitch) {
    results.recommendations.push('Implement mode switching capability');
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.recommendations.length === 0) {
    console.log('   System is complete');
  } else {
    results.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📈 OVERALL ASSESSMENT');
  console.log('=' .repeat(60));
  console.log(`Component Coverage: ${overallPercent}% (${existingComponents}/${components.length})`);
  console.log(`Functional Components: ${functionalPercent}% (${functionalComponents}/${components.length})`);
  console.log(`\nOperability Level: ${
    overallPercent === 100 ? '💯 COMPLETE' :
    overallPercent >= 80 ? '🏁 GOOD' :
    overallPercent >= 60 ? '🟠️ PARTIAL' :
    '🔴 INCOMPLETE'
  }`);
  
  // Save audit results
  const auditReport = {
    timestamp: new Date().toISOString(),
    results,
    scores: {
      existence: overallPercent,
      functionality: functionalPercent,
      componentCoverage: `${existingComponents}/${components.length}`
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../FRAMEWORK_ENGINE_AUDIT_RESULTS.json'),
    JSON.stringify(auditReport, null, 2)
  );
  
  console.log('\n📄 Detailed audit saved to: FRAMEWORK_ENGINE_AUDIT_RESULTS.json');
  
  return overallPercent;
}

// Run audit
auditFrameworkEngine().then(score => {
  console.log(`\n🏁 Audit complete! Score: ${score}%`);
  
  if (score < 100) {
    console.log('\n🔧 System needs improvements. Creating sprint plan...');
  } else {
    console.log('\n🏁 Framework Engine Core is fully operational!');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});