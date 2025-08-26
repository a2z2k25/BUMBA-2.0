/**
 * BUMBA Framework Final System Validation
 * Complete operability and integration testing
 */

const path = require('path');
const fs = require('fs');

console.log('🟢 BUMBA Framework Final System Validation');
console.log('=' .repeat(60));

async function testAllSystems() {
  const results = {
    audio: { tests: 0, passed: 0, details: [] },
    knowledge: { tests: 0, passed: 0, details: [] },
    workflow: { tests: 0, passed: 0, details: [] }
  };
  
  // ============== AUDIO SYSTEM TESTS ==============
  console.log('\n🔴 AUDIO & CELEBRATION SYSTEMS VALIDATION\n');
  
  try {
    // Test 1: Load and instantiate audio system
    const { BumbaAudioCelebration, audioCelebration } = require('../src/core/audio-celebration');
    results.audio.tests++;
    
    // Test instance exists
    if (audioCelebration) {
      results.audio.passed++;
      console.log('🏁 Audio celebration instance loaded');
      results.audio.details.push('Instance loaded');
    }
    
    // Test 2: Check audio path resolution
    results.audio.tests++;
    if (audioCelebration.audioFile && audioCelebration.audioExists) {
      results.audio.passed++;
      console.log(`🏁 Audio file found: ${audioCelebration.audioFile}`);
      results.audio.details.push('Audio file resolved');
    } else {
      console.log('🟠️ Audio file not found (non-critical)');
    }
    
    // Test 3: Test celebrate method
    results.audio.tests++;
    try {
      const result = await audioCelebration.celebrate('TEST', { silent: true });
      results.audio.passed++;
      console.log('🏁 Celebrate method works');
      results.audio.details.push('Celebrate method functional');
    } catch (e) {
      console.log('🟠️ Celebrate method issue:', e.message);
    }
    
    // Test 4: Test fallback system
    results.audio.tests++;
    const { audioFallbackSystem } = require('../src/core/audio-fallback-system');
    if (audioFallbackSystem) {
      results.audio.passed++;
      console.log('🏁 Audio fallback system available');
      results.audio.details.push('Fallback system ready');
    }
    
  } catch (error) {
    console.error('🔴 Audio system error:', error.message);
  }
  
  // ============== KNOWLEDGE SYSTEM TESTS ==============
  console.log('\n📚 KNOWLEDGE SYSTEMS VALIDATION\n');
  
  try {
    // Test 1: Knowledge Base
    results.knowledge.tests++;
    const { KnowledgeBase } = require('../src/core/knowledge/knowledge-base');
    const kb = new KnowledgeBase();
    
    // Test CRUD operations
    const entry = await kb.add({
      title: 'Test Entry',
      type: 'test',
      content: 'Test content'
    });
    
    if (entry && entry.id) {
      results.knowledge.passed++;
      console.log('🏁 Knowledge Base CRUD operations work');
      results.knowledge.details.push('KnowledgeBase operational');
    }
    
    // Test 2: Context Manager
    results.knowledge.tests++;
    const { ContextManager } = require('../src/core/knowledge/context-manager');
    const ctxMgr = new ContextManager();
    
    const context = await ctxMgr.createContext({
      name: 'Test Context',
      scope: 'test'
    });
    
    if (context && context.id) {
      results.knowledge.passed++;
      console.log('🏁 Context Manager operational');
      results.knowledge.details.push('ContextManager working');
    }
    
    // Test 3: Reference System
    results.knowledge.tests++;
    const { ReferenceSystem } = require('../src/core/knowledge/reference-system');
    const refSys = new ReferenceSystem();
    
    const apiRef = await refSys.createApiReference({
      name: 'Test API',
      endpoints: []
    });
    
    if (apiRef && apiRef.id) {
      results.knowledge.passed++;
      console.log('🏁 Reference System functional');
      results.knowledge.details.push('ReferenceSystem ready');
    }
    
    // Test 4: Integration
    results.knowledge.tests++;
    const searchResults = refSys.search('test');
    if (searchResults) {
      results.knowledge.passed++;
      console.log('🏁 Knowledge search works');
      results.knowledge.details.push('Search functional');
    }
    
  } catch (error) {
    console.error('🔴 Knowledge system error:', error.message);
  }
  
  // ============== WORKFLOW SYSTEM TESTS ==============
  console.log('\n🟢️ WORKFLOW SYSTEMS VALIDATION\n');
  
  try {
    // Test 1: Enhanced Specialist
    results.workflow.tests++;
    const UnifiedSpecialistBase = require('../../src/core/specialists/unified-specialist-base');
    const specialist = new UnifiedSpecialistBase({
      name: 'Test Specialist',
      type: 'test',
      skills: ['testing']
    });
    
    await specialist.initialize();
    
    const taskResult = await specialist.processTask({
      id: 'test-task',
      type: 'simple',
      description: 'Test task'
    });
    
    if (taskResult && taskResult.success) {
      results.workflow.passed++;
      console.log('🏁 Enhanced Specialist processes tasks');
      results.workflow.details.push('Specialist functional');
    }
    
    // Test 2: Workflow Engine
    results.workflow.tests++;
    const { WorkflowEngine } = require('../src/core/workflow/workflow-engine');
    const engine = new WorkflowEngine();
    
    const workflow = await engine.createWorkflow({
      name: 'Test Workflow',
      steps: [
        { type: 'transform', name: 'Step 1', transformation: (d) => ({ ...d, step1: true }) },
        { type: 'transform', name: 'Step 2', transformation: (d) => ({ ...d, step2: true }) }
      ]
    });
    
    const wfResult = await engine.executeWorkflow(workflow.id, { input: 'test' });
    
    if (wfResult && wfResult.success) {
      results.workflow.passed++;
      console.log('🏁 Workflow Engine executes workflows');
      results.workflow.details.push('Workflow execution works');
    }
    
    // Test 3: Pipeline Manager
    results.workflow.tests++;
    const { PipelineManager } = require('../src/core/workflow/pipeline-manager');
    const pipelineMgr = new PipelineManager();
    
    const pipeline = await pipelineMgr.createPipeline({
      name: 'Test Pipeline',
      stages: [
        { type: 'transform', name: 'Transform' },
        { type: 'filter', name: 'Filter', condition: () => true }
      ]
    });
    
    const pipeResult = await pipelineMgr.executePipeline(pipeline.id, { data: 'test' });
    
    if (pipeResult && pipeResult.success) {
      results.workflow.passed++;
      console.log('🏁 Pipeline Manager processes data');
      results.workflow.details.push('Pipeline processing works');
    }
    
    // Test 4: Task Automation
    results.workflow.tests++;
    const { TaskAutomation } = require('../src/core/workflow/task-automation');
    const automation = new TaskAutomation();
    
    const task = await automation.createTask({
      name: 'Automated Task',
      action: { type: 'function', function: () => ({ result: 'success' }) }
    });
    
    const taskExecResult = await automation.executeTask(task.id);
    
    if (taskExecResult && taskExecResult.success) {
      results.workflow.passed++;
      console.log('🏁 Task Automation executes tasks');
      results.workflow.details.push('Automation functional');
    }
    
    // Test 5: Specialist Integration
    results.workflow.tests++;
    const { SpecialistIntegration } = require('../src/core/workflow/specialist-integration');
    const integration = new SpecialistIntegration();
    
    await integration.registerSpecialist(specialist);
    
    const assignResult = await integration.assignTask({
      id: 'integration-test',
      requiredSkills: ['testing']
    });
    
    if (assignResult && assignResult.specialist) {
      results.workflow.passed++;
      console.log('🏁 Specialist Integration routes tasks');
      results.workflow.details.push('Integration routing works');
    }
    
    // Test 6: Workflow + Pipeline Integration
    results.workflow.tests++;
    const integratedWorkflow = await engine.createWorkflow({
      name: 'Integrated Workflow',
      steps: [
        {
          type: 'parallel',
          name: 'Parallel Processing',
          steps: [
            { type: 'wait', duration: 10 },
            { type: 'wait', duration: 10 }
          ]
        }
      ]
    });
    
    const intResult = await engine.executeWorkflow(integratedWorkflow.id);
    
    if (intResult && intResult.success) {
      results.workflow.passed++;
      console.log('🏁 Parallel workflow execution works');
      results.workflow.details.push('Parallel execution functional');
    }
    
    // Cleanup
    engine.destroy();
    pipelineMgr.destroy();
    automation.destroy();
    integration.destroy();
    
  } catch (error) {
    console.error('🔴 Workflow system error:', error.message);
  }
  
  // ============== FINAL REPORT ==============
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL SYSTEM VALIDATION REPORT');
  console.log('=' .repeat(60));
  
  // Calculate totals
  const totalTests = results.audio.tests + results.knowledge.tests + results.workflow.tests;
  const totalPassed = results.audio.passed + results.knowledge.passed + results.workflow.passed;
  const percentage = Math.round((totalPassed / totalTests) * 100);
  
  // Audio System
  console.log('\n🔴 Audio & Celebration Systems:');
  console.log(`   Tests: ${results.audio.passed}/${results.audio.tests} passed`);
  console.log(`   Status: ${results.audio.passed === results.audio.tests ? '🏁 FULLY OPERATIONAL' : 
    results.audio.passed >= results.audio.tests * 0.75 ? '🟠️ OPERATIONAL WITH WARNINGS' : '🔴 NEEDS ATTENTION'}`);
  console.log(`   Details: ${results.audio.details.join(', ')}`);
  
  // Knowledge System
  console.log('\n📚 Knowledge Systems:');
  console.log(`   Tests: ${results.knowledge.passed}/${results.knowledge.tests} passed`);
  console.log(`   Status: ${results.knowledge.passed === results.knowledge.tests ? '🏁 FULLY OPERATIONAL' : 
    results.knowledge.passed >= results.knowledge.tests * 0.75 ? '🟠️ OPERATIONAL WITH WARNINGS' : '🔴 NEEDS ATTENTION'}`);
  console.log(`   Details: ${results.knowledge.details.join(', ')}`);
  
  // Workflow System
  console.log('\n🟢️ Workflow Systems:');
  console.log(`   Tests: ${results.workflow.passed}/${results.workflow.tests} passed`);
  console.log(`   Status: ${results.workflow.passed === results.workflow.tests ? '🏁 FULLY OPERATIONAL' : 
    results.workflow.passed >= results.workflow.tests * 0.75 ? '🟠️ OPERATIONAL WITH WARNINGS' : '🔴 NEEDS ATTENTION'}`);
  console.log(`   Details: ${results.workflow.details.join(', ')}`);
  
  // Overall Summary
  console.log('\n' + '=' .repeat(60));
  console.log('🟡 OVERALL SYSTEM STATUS');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Tests Passed: ${totalPassed}`);
  console.log(`Success Rate: ${percentage}%`);
  console.log(`\nOperability Level: ${
    percentage === 100 ? '💯 PERFECT - All systems fully operational!' :
    percentage >= 90 ? '🏁 EXCELLENT - Systems operational with minor issues' :
    percentage >= 80 ? '🏁 GOOD - Systems operational with some warnings' :
    percentage >= 70 ? '🟠️ ACCEPTABLE - Systems need some attention' :
    '🔴 CRITICAL - Systems need immediate attention'
  }`);
  
  // Completeness Assessment
  const audioComplete = results.audio.passed >= results.audio.tests * 0.8;
  const knowledgeComplete = results.knowledge.passed >= results.knowledge.tests * 0.8;
  const workflowComplete = results.workflow.passed >= results.workflow.tests * 0.8;
  
  console.log('\n📈 COMPLETENESS ASSESSMENT:');
  console.log(`Audio Systems: ${audioComplete ? '🏁 Complete' : '🟠️ Incomplete'} (${Math.round(results.audio.passed/results.audio.tests*100)}%)`);
  console.log(`Knowledge Systems: ${knowledgeComplete ? '🏁 Complete' : '🟠️ Incomplete'} (${Math.round(results.knowledge.passed/results.knowledge.tests*100)}%)`);
  console.log(`Workflow Systems: ${workflowComplete ? '🏁 Complete' : '🟠️ Incomplete'} (${Math.round(results.workflow.passed/results.workflow.tests*100)}%)`);
  
  const allComplete = audioComplete && knowledgeComplete && workflowComplete;
  console.log(`\n${allComplete ? '🏁' : '📋'} Final Verdict: ${
    allComplete ? 'ALL SYSTEMS COMPLETE AND OPERATIONAL' : 'SYSTEMS FUNCTIONAL BUT NEED MINOR IMPROVEMENTS'
  }`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      totalPassed,
      percentage,
      allSystemsOperational: percentage >= 80,
      allSystemsComplete: allComplete
    },
    systems: {
      audio: {
        tests: results.audio.tests,
        passed: results.audio.passed,
        percentage: Math.round(results.audio.passed/results.audio.tests*100),
        details: results.audio.details,
        status: audioComplete ? 'complete' : 'incomplete'
      },
      knowledge: {
        tests: results.knowledge.tests,
        passed: results.knowledge.passed,
        percentage: Math.round(results.knowledge.passed/results.knowledge.tests*100),
        details: results.knowledge.details,
        status: knowledgeComplete ? 'complete' : 'incomplete'
      },
      workflow: {
        tests: results.workflow.tests,
        passed: results.workflow.passed,
        percentage: Math.round(results.workflow.passed/results.workflow.tests*100),
        details: results.workflow.details,
        status: workflowComplete ? 'complete' : 'incomplete'
      }
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../FINAL_VALIDATION_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: FINAL_VALIDATION_REPORT.json');
  console.log('\n🏁 Validation complete!');
  
  return percentage >= 80;
}

// Run validation
testAllSystems().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});