#!/usr/bin/env node

/**
 * Test Specialist Factory
 * Verify that real specialists are loading correctly
 */

const { getFactory } = require('./specialist-factory');

async function testSpecialistFactory() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Specialist Factory');
  console.log('='.repeat(60));
  
  const factory = getFactory();
  
  // Test each specialist needed for Sprint 1
  const testSpecialists = [
    'api-architect',
    'backend-developer',
    'ui-designer',
    'ux-specialist',
    'frontend-developer',
    'product-owner',
    'business-analyst',
    'market-researcher'
  ];
  
  console.log('\nTesting specialist creation:');
  console.log('-'.repeat(40));
  
  for (const specialistId of testSpecialists) {
    try {
      const specialist = await factory.createSpecialist(specialistId, 'test');
      
      if (specialist.isMock) {
        console.log(`🔴 ${specialistId}: Mock specialist (no real class)`);
      } else {
        console.log(`🏁 ${specialistId}: Real specialist loaded`);
        
        // Test if specialist can execute
        if (specialist.execute) {
          const result = await specialist.execute('Test prompt');
          console.log(`   Can execute: ${result.success ? 'Yes' : 'No'}`);
        }
      }
    } catch (error) {
      console.log(`🔴 ${specialistId}: Error - ${error.message}`);
    }
  }
  
  // Display metrics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Factory Metrics:');
  const metrics = factory.getMetrics();
  console.log(`Available classes: ${metrics.availableClasses}`);
  console.log(`Real specialists: ${metrics.realSpecialists}`);
  console.log(`Mock specialists: ${metrics.mockSpecialists}`);
  
  // List available specialists
  console.log('\nAvailable specialist classes:');
  const available = factory.getAvailableSpecialists();
  available.forEach(id => console.log(`  - ${id}`));
  
  console.log('\n' + '='.repeat(60));
}

// Run test
testSpecialistFactory().catch(console.error);