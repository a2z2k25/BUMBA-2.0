/**
 * BUMBA Framework System Operability Test
 * Comprehensive testing of Audio, Knowledge, and Workflow Systems
 */

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  audioSystem: { status: 'pending', tests: [], errors: [] },
  knowledgeSystem: { status: 'pending', tests: [], errors: [] },
  workflowSystem: { status: 'pending', tests: [], errors: [] },
  overall: { passed: 0, failed: 0 }
};

// Helper function to test module loading
function testModuleLoad(modulePath, moduleName) {
  try {
    const module = require(modulePath);
    return { success: true, module, message: `🏁 ${moduleName} loaded successfully` };
  } catch (error) {
    return { success: false, error: error.message, message: `🔴 ${moduleName} failed to load: ${error.message}` };
  }
}

// Helper function to test class instantiation
async function testInstantiation(ClassOrModule, className, config = {}) {
  try {
    let instance;
    if (ClassOrModule.getInstance) {
      instance = ClassOrModule.getInstance(config);
    } else if (ClassOrModule.default) {
      instance = new ClassOrModule.default(config);
    } else {
      instance = new ClassOrModule(config);
    }
    
    // Check if it has expected methods
    const hasInit = typeof instance.initialize === 'function';
    const hasEvents = typeof instance.emit === 'function';
    
    return { 
      success: true, 
      instance,
      message: `🏁 ${className} instantiated successfully`,
      details: { hasInit, hasEvents }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      message: `🔴 ${className} instantiation failed: ${error.message}`
    };
  }
}

// Test Audio & Celebration Systems
async function testAudioSystem() {
  console.log('\n🔴 Testing Audio & Celebration Systems...\n');
  
  // Test 1: Load audio celebration module
  const audioModule = testModuleLoad(
    path.join(__dirname, '../src/core/audio-celebration.js'),
    'Audio Celebration Module'
  );
  results.audioSystem.tests.push(audioModule);
  console.log(audioModule.message);
  
  if (audioModule.success) {
    // Test 2: Check AudioCelebration class
    const AudioCelebration = audioModule.module.AudioCelebration || audioModule.module;
    const audioTest = await testInstantiation(AudioCelebration, 'AudioCelebration');
    results.audioSystem.tests.push(audioTest);
    console.log(audioTest.message);
    
    if (audioTest.success && audioTest.instance) {
      // Test 3: Check audio path resolution
      try {
        const instance = audioTest.instance;
        if (typeof instance.resolveAudioPath === 'function') {
          const audioPath = instance.resolveAudioPath();
          const pathExists = audioPath && typeof audioPath === 'string';
          const test = { 
            success: pathExists,
            message: pathExists ? 
              `🏁 Audio path resolution working: ${audioPath}` : 
              '🔴 Audio path resolution failed'
          };
          results.audioSystem.tests.push(test);
          console.log(test.message);
        }
      } catch (error) {
        results.audioSystem.errors.push(error.message);
      }
      
      // Test 4: Check celebration methods
      try {
        const instance = audioTest.instance;
        const hasCelebrate = typeof instance.celebrate === 'function';
        const hasPlayAudio = typeof instance.playAudio === 'function';
        const test = {
          success: hasCelebrate && hasPlayAudio,
          message: hasCelebrate && hasPlayAudio ?
            '🏁 Celebration methods available' :
            '🔴 Missing celebration methods'
        };
        results.audioSystem.tests.push(test);
        console.log(test.message);
      } catch (error) {
        results.audioSystem.errors.push(error.message);
      }
    }
  }
  
  // Test 5: Load fallback system
  const fallbackModule = testModuleLoad(
    path.join(__dirname, '../src/core/audio-fallback-system.js'),
    'Audio Fallback System'
  );
  results.audioSystem.tests.push(fallbackModule);
  console.log(fallbackModule.message);
  
  // Calculate status
  const passed = results.audioSystem.tests.filter(t => t.success).length;
  const total = results.audioSystem.tests.length;
  results.audioSystem.status = passed === total ? 'passed' : 'failed';
  results.audioSystem.score = `${passed}/${total}`;
  
  console.log(`\n📊 Audio System Score: ${results.audioSystem.score}`);
}

// Test Knowledge Systems
async function testKnowledgeSystem() {
  console.log('\n📚 Testing Knowledge Systems...\n');
  
  // Test 1: Load KnowledgeBase
  const kbModule = testModuleLoad(
    path.join(__dirname, '../src/core/knowledge/knowledge-base.js'),
    'Knowledge Base Module'
  );
  results.knowledgeSystem.tests.push(kbModule);
  console.log(kbModule.message);
  
  if (kbModule.success) {
    // Test 2: Instantiate KnowledgeBase
    const KnowledgeBase = kbModule.module.KnowledgeBase || kbModule.module;
    const kbTest = await testInstantiation(KnowledgeBase, 'KnowledgeBase');
    results.knowledgeSystem.tests.push(kbTest);
    console.log(kbTest.message);
    
    if (kbTest.success && kbTest.instance) {
      // Test 3: Test CRUD operations
      try {
        const kb = kbTest.instance;
        const hasAdd = typeof kb.add === 'function';
        const hasQuery = typeof kb.query === 'function';
        const hasUpdate = typeof kb.update === 'function';
        const hasDelete = typeof kb.delete === 'function';
        
        const test = {
          success: hasAdd && hasQuery && hasUpdate && hasDelete,
          message: hasAdd && hasQuery && hasUpdate && hasDelete ?
            '🏁 CRUD operations available' :
            '🔴 Missing CRUD operations'
        };
        results.knowledgeSystem.tests.push(test);
        console.log(test.message);
      } catch (error) {
        results.knowledgeSystem.errors.push(error.message);
      }
    }
  }
  
  // Test 4: Load ContextManager
  const ctxModule = testModuleLoad(
    path.join(__dirname, '../src/core/knowledge/context-manager.js'),
    'Context Manager Module'
  );
  results.knowledgeSystem.tests.push(ctxModule);
  console.log(ctxModule.message);
  
  if (ctxModule.success) {
    // Test 5: Instantiate ContextManager
    const ContextManager = ctxModule.module.ContextManager || ctxModule.module;
    const ctxTest = await testInstantiation(ContextManager, 'ContextManager');
    results.knowledgeSystem.tests.push(ctxTest);
    console.log(ctxTest.message);
  }
  
  // Test 6: Load ReferenceSystem
  const refModule = testModuleLoad(
    path.join(__dirname, '../src/core/knowledge/reference-system.js'),
    'Reference System Module'
  );
  results.knowledgeSystem.tests.push(refModule);
  console.log(refModule.message);
  
  if (refModule.success) {
    // Test 7: Instantiate ReferenceSystem
    const ReferenceSystem = refModule.module.ReferenceSystem || refModule.module;
    const refTest = await testInstantiation(ReferenceSystem, 'ReferenceSystem');
    results.knowledgeSystem.tests.push(refTest);
    console.log(refTest.message);
  }
  
  // Calculate status
  const passed = results.knowledgeSystem.tests.filter(t => t.success).length;
  const total = results.knowledgeSystem.tests.length;
  results.knowledgeSystem.status = passed === total ? 'passed' : 'failed';
  results.knowledgeSystem.score = `${passed}/${total}`;
  
  console.log(`\n📊 Knowledge System Score: ${results.knowledgeSystem.score}`);
}

// Test Workflow Systems
async function testWorkflowSystem() {
  console.log('\n🟢️ Testing Workflow Systems...\n');
  
  // Test 1: Load Specialist Base
  const specialistModule = testModuleLoad(
    path.join(__dirname, '../src/core/specialists/specialist-base.js'),
    'Enhanced Specialist Base'
  );
  results.workflowSystem.tests.push(specialistModule);
  console.log(specialistModule.message);
  
  if (specialistModule.success) {
    // Test 2: Instantiate Specialist
    const EnhancedSpecialist = specialistModule.module;
    const specialistTest = await testInstantiation(EnhancedSpecialist, 'EnhancedSpecialist', {
      name: 'Test Specialist',
      type: 'test'
    });
    results.workflowSystem.tests.push(specialistTest);
    console.log(specialistTest.message);
    
    if (specialistTest.success && specialistTest.instance) {
      // Test 3: Check specialist methods
      try {
        const specialist = specialistTest.instance;
        const hasProcessTask = typeof specialist.processTask === 'function';
        const hasAnalyzeTask = typeof specialist.analyzeTask === 'function';
        const hasLearnFromTask = typeof specialist.learnFromTask === 'function';
        
        const test = {
          success: hasProcessTask && hasAnalyzeTask && hasLearnFromTask,
          message: hasProcessTask && hasAnalyzeTask && hasLearnFromTask ?
            '🏁 Specialist methods available' :
            '🔴 Missing specialist methods'
        };
        results.workflowSystem.tests.push(test);
        console.log(test.message);
      } catch (error) {
        results.workflowSystem.errors.push(error.message);
      }
    }
  }
  
  // Test 4: Load Workflow Engine
  const workflowModule = testModuleLoad(
    path.join(__dirname, '../src/core/workflow/workflow-engine.js'),
    'Workflow Engine'
  );
  results.workflowSystem.tests.push(workflowModule);
  console.log(workflowModule.message);
  
  if (workflowModule.success) {
    // Test 5: Instantiate Workflow Engine
    const { WorkflowEngine } = workflowModule.module;
    const workflowTest = await testInstantiation(WorkflowEngine, 'WorkflowEngine');
    results.workflowSystem.tests.push(workflowTest);
    console.log(workflowTest.message);
    
    if (workflowTest.success && workflowTest.instance) {
      // Test 6: Create and execute workflow
      try {
        const engine = workflowTest.instance;
        const workflow = await engine.createWorkflow({
          name: 'Test Workflow',
          steps: [
            { type: 'transform', name: 'Test Step', transformation: (d) => d }
          ]
        });
        
        const test = {
          success: workflow && workflow.id,
          message: workflow && workflow.id ?
            '🏁 Workflow creation working' :
            '🔴 Workflow creation failed'
        };
        results.workflowSystem.tests.push(test);
        console.log(test.message);
      } catch (error) {
        results.workflowSystem.errors.push(error.message);
      }
    }
  }
  
  // Test 7: Load Pipeline Manager
  const pipelineModule = testModuleLoad(
    path.join(__dirname, '../src/core/workflow/pipeline-manager.js'),
    'Pipeline Manager'
  );
  results.workflowSystem.tests.push(pipelineModule);
  console.log(pipelineModule.message);
  
  // Test 8: Load Task Automation
  const automationModule = testModuleLoad(
    path.join(__dirname, '../src/core/workflow/task-automation.js'),
    'Task Automation'
  );
  results.workflowSystem.tests.push(automationModule);
  console.log(automationModule.message);
  
  // Test 9: Load Specialist Integration
  const integrationModule = testModuleLoad(
    path.join(__dirname, '../src/core/workflow/specialist-integration.js'),
    'Specialist Integration'
  );
  results.workflowSystem.tests.push(integrationModule);
  console.log(integrationModule.message);
  
  // Test 10: Check Task Orchestrator
  const orchestratorModule = testModuleLoad(
    path.join(__dirname, '../src/core/orchestration/task-orchestrator.js'),
    'Task Orchestrator'
  );
  results.workflowSystem.tests.push(orchestratorModule);
  console.log(orchestratorModule.message);
  
  // Calculate status
  const passed = results.workflowSystem.tests.filter(t => t.success).length;
  const total = results.workflowSystem.tests.length;
  results.workflowSystem.status = passed === total ? 'passed' : 'failed';
  results.workflowSystem.score = `${passed}/${total}`;
  
  console.log(`\n📊 Workflow System Score: ${results.workflowSystem.score}`);
}

// Main test runner
async function runSystemTests() {
  console.log('🟢 BUMBA Framework System Operability Test');
  console.log('=' .repeat(50));
  
  try {
    // Test all systems
    await testAudioSystem();
    await testKnowledgeSystem();
    await testWorkflowSystem();
    
    // Calculate overall results
    results.overall.passed = 
      results.audioSystem.tests.filter(t => t.success).length +
      results.knowledgeSystem.tests.filter(t => t.success).length +
      results.workflowSystem.tests.filter(t => t.success).length;
    
    results.overall.failed = 
      results.audioSystem.tests.filter(t => !t.success).length +
      results.knowledgeSystem.tests.filter(t => !t.success).length +
      results.workflowSystem.tests.filter(t => !t.success).length;
    
    // Print final report
    console.log('\n' + '=' .repeat(50));
    console.log('📋 FINAL SYSTEM OPERABILITY REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n🔴 Audio & Celebration Systems:');
    console.log(`   Status: ${results.audioSystem.status === 'passed' ? '🏁 OPERATIONAL' : '🔴 ISSUES FOUND'}`);
    console.log(`   Score: ${results.audioSystem.score}`);
    console.log(`   Completeness: ${results.audioSystem.status === 'passed' ? '100%' : 
      Math.round((parseInt(results.audioSystem.score.split('/')[0]) / parseInt(results.audioSystem.score.split('/')[1])) * 100) + '%'}`);
    
    console.log('\n📚 Knowledge Systems:');
    console.log(`   Status: ${results.knowledgeSystem.status === 'passed' ? '🏁 OPERATIONAL' : '🔴 ISSUES FOUND'}`);
    console.log(`   Score: ${results.knowledgeSystem.score}`);
    console.log(`   Completeness: ${results.knowledgeSystem.status === 'passed' ? '100%' : 
      Math.round((parseInt(results.knowledgeSystem.score.split('/')[0]) / parseInt(results.knowledgeSystem.score.split('/')[1])) * 100) + '%'}`);
    
    console.log('\n🟢️ Workflow Systems:');
    console.log(`   Status: ${results.workflowSystem.status === 'passed' ? '🏁 OPERATIONAL' : '🔴 ISSUES FOUND'}`);
    console.log(`   Score: ${results.workflowSystem.score}`);
    console.log(`   Completeness: ${results.workflowSystem.status === 'passed' ? '100%' : 
      Math.round((parseInt(results.workflowSystem.score.split('/')[0]) / parseInt(results.workflowSystem.score.split('/')[1])) * 100) + '%'}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 OVERALL SYSTEM STATUS');
    console.log('=' .repeat(50));
    console.log(`Total Tests Passed: ${results.overall.passed}`);
    console.log(`Total Tests Failed: ${results.overall.failed}`);
    console.log(`Success Rate: ${Math.round((results.overall.passed / (results.overall.passed + results.overall.failed)) * 100)}%`);
    
    const allPassed = results.audioSystem.status === 'passed' && 
                     results.knowledgeSystem.status === 'passed' && 
                     results.workflowSystem.status === 'passed';
    
    console.log(`\n${allPassed ? '🏁' : '🟠️'} System Status: ${allPassed ? 
      '🏁 ALL SYSTEMS OPERATIONAL' : 
      '🟠️ SOME SYSTEMS NEED ATTENTION'}`);
    
    // Save results to file
    const reportPath = path.join(__dirname, '../SYSTEM_TEST_RESULTS.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n🔴 Critical error during testing:', error);
    process.exit(1);
  }
}

// Run the tests
runSystemTests().then(() => {
  console.log('\n🏁 System operability test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n🔴 Test runner failed:', error);
  process.exit(1);
});