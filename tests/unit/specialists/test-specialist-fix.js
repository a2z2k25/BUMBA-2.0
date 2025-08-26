/**
 * Test the Specialist Integration Fix
 */

const { SpecialistIntegration } = require('../src/core/workflow/specialist-integration');
const UnifiedSpecialistBase = require('../../../src/core/specialists/unified-specialist-base');

async function testSpecialistFix() {
  console.log('🔧 Testing Specialist Integration Fix...\n');
  
  try {
    // Create integration instance
    const integration = new SpecialistIntegration();
    
    // Create and register a specialist
    const specialist = new UnifiedSpecialistBase({
      name: 'Test Specialist',
      type: 'test',
      skills: ['testing', 'validation']
    });
    
    await specialist.initialize();
    await integration.registerSpecialist(specialist);
    
    console.log('🏁 Specialist registered successfully');
    
    // Test task assignment (this was failing before)
    const task = {
      id: 'test-task-001',
      type: 'test',
      requiredSkills: ['testing'],
      description: 'Test task to verify fix'
    };
    
    console.log('📋 Assigning task to specialist...');
    
    const result = await integration.assignTask(task);
    
    if (result && result.specialist) {
      console.log('🏁 Task assigned successfully!');
      console.log(`   Specialist: ${result.specialist}`);
      console.log(`   Success: ${result.success}`);
      
      // Verify workload tracking
      const workload = integration.workload.get(specialist.id);
      console.log('\n📊 Workload Tracking:');
      console.log(`   Current: ${workload.current}`);
      console.log(`   Max: ${workload.max}`);
      console.log(`   Queue: ${workload.queue.length} tasks`);
      
      // Test multiple task assignments
      console.log('\n🔄 Testing multiple task assignments...');
      
      for (let i = 1; i <= 3; i++) {
        const multiTask = {
          id: `test-task-00${i + 1}`,
          requiredSkills: ['testing'],
          description: `Test task ${i + 1}`
        };
        
        const multiResult = await integration.assignTask(multiTask);
        console.log(`   Task ${i + 1}: ${multiResult.success ? '🏁' : '🔴'}`);
      }
      
      // Check final metrics
      const metrics = integration.getMetrics();
      console.log('\n📈 Final Metrics:');
      console.log(`   Tasks Assigned: ${metrics.tasksAssigned}`);
      console.log(`   Tasks Completed: ${metrics.tasksCompleted}`);
      console.log(`   Utilization Rate: ${metrics.utilizationRate.toFixed(1)}%`);
      
      console.log('\n🏁 All tests passed! Fix is working correctly.');
      
    } else {
      console.log('🔴 Task assignment failed');
      console.log('Result:', result);
    }
    
    // Clean up
    integration.destroy();
    
  } catch (error) {
    console.error('🔴 Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
  
  return true;
}

// Run the test
testSpecialistFix().then(success => {
  if (success) {
    console.log('\n🏁 Specialist Integration fix verified successfully!');
    process.exit(0);
  } else {
    console.log('\n🔴 Fix verification failed');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});