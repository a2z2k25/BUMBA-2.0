#!/usr/bin/env node

/**
 * Test Sprint 2 Specialists
 * Verify that all Sprint 2 specialists are loading correctly
 */

const { getFactory } = require('./specialist-factory-sprint2');

async function testSprint2Specialists() {
  console.log('='.repeat(80));
  console.log('🟢 SPRINT 2: Testing Specialist Factory');
  console.log('='.repeat(80));
  
  const factory = getFactory();
  
  // Sprint 1 specialists (should still work)
  const sprint1Specialists = [
    'api-architect',
    'backend-developer',
    'ui-designer',
    'ux-specialist',
    'frontend-developer',
    'product-owner',
    'business-analyst',
    'market-researcher'
  ];
  
  // Sprint 2 new specialists
  const sprint2Specialists = [
    'devops-engineer',
    'product-strategist',
    'technical-writer',
    'ai-engineer',
    'ux-research-specialist',
    'security-specialist',
    'database-admin',
    'sre-specialist',
    'test-automator',
    'cloud-architect',
    'code-reviewer',
    'database-optimizer'
  ];
  
  console.log('\n📋 SPRINT 1 SPECIALISTS (Should still work):');
  console.log('-'.repeat(60));
  
  let sprint1Success = 0;
  for (const specialistId of sprint1Specialists) {
    try {
      const specialist = await factory.createSpecialist(specialistId, 'test');
      
      if (specialist.isMock) {
        console.log(`🔴 ${specialistId}: Mock specialist`);
      } else {
        console.log(`🏁 ${specialistId}: Real specialist loaded`);
        sprint1Success++;
      }
    } catch (error) {
      console.log(`🔴 ${specialistId}: Error - ${error.message}`);
    }
  }
  
  console.log(`\nSprint 1 Coverage: ${sprint1Success}/${sprint1Specialists.length} (${(sprint1Success/sprint1Specialists.length*100).toFixed(0)}%)`);
  
  console.log('\n📋 SPRINT 2 NEW SPECIALISTS:');
  console.log('-'.repeat(60));
  
  let sprint2Success = 0;
  for (const specialistId of sprint2Specialists) {
    try {
      const specialist = await factory.createSpecialist(specialistId, 'test');
      
      if (specialist.isMock) {
        console.log(`🟠️ ${specialistId}: Mock specialist (using fallback)`);
      } else {
        console.log(`🏁 ${specialistId}: Real specialist loaded`);
        sprint2Success++;
      }
    } catch (error) {
      console.log(`🔴 ${specialistId}: Error - ${error.message}`);
    }
  }
  
  console.log(`\nSprint 2 Coverage: ${sprint2Success}/${sprint2Specialists.length} (${(sprint2Success/sprint2Specialists.length*100).toFixed(0)}%)`);
  
  // Display metrics
  console.log('\n' + '='.repeat(80));
  console.log('📊 FACTORY METRICS:');
  console.log('-'.repeat(60));
  const metrics = factory.getMetrics();
  console.log(`Total available classes: ${metrics.availableClasses}`);
  console.log(`Real specialists created: ${metrics.created}`);
  console.log(`Specialists reused: ${metrics.reused}`);
  console.log(`Mock specialists created: ${metrics.mocked}`);
  console.log(`Errors encountered: ${metrics.errors}`);
  
  // Coverage report
  console.log('\n📈 COVERAGE REPORT:');
  console.log('-'.repeat(60));
  const coverage = factory.getCoverageReport();
  console.log(`Real specialist coverage: ${coverage.coverage}`);
  console.log(`Total covered: ${coverage.covered.length}`);
  console.log(`Using mocks: ${coverage.mocked.length}`);
  console.log(`Missing: ${coverage.missing.length}`);
  
  if (coverage.mocked.length > 0) {
    console.log('\nSpecialists using temporary fallbacks:');
    coverage.mocked.forEach(id => console.log(`  - ${id}`));
  }
  
  // Test command coverage
  console.log('\n🟡 COMMAND COVERAGE TEST:');
  console.log('-'.repeat(60));
  
  const testCommands = [
    { name: 'api', specialists: ['api-architect', 'backend-developer'] },
    { name: 'secure', specialists: ['security-specialist', 'backend-developer'] },
    { name: 'devops', specialists: ['devops-engineer', 'cloud-architect', 'sre-specialist'] },
    { name: 'test', specialists: ['test-automator', 'frontend-developer', 'backend-developer'] },
    { name: 'docs', specialists: ['technical-writer', 'backend-developer', 'frontend-developer'] },
    { name: 'analyze', specialists: ['business-analyst', 'ux-specialist', 'backend-developer'] }
  ];
  
  for (const cmd of testCommands) {
    const specialists = await factory.createSpecialists(cmd.specialists, 'test');
    const realCount = specialists.filter(s => !s.isMock).length;
    const status = realCount === cmd.specialists.length ? '🏁' : '🟠️';
    console.log(`${status} ${cmd.name}: ${realCount}/${cmd.specialists.length} real specialists`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🟡 Sprint 2 Specialist Factory Test Complete!');
  console.log('='.repeat(80));
  
  const totalSuccess = sprint1Success + sprint2Success;
  const totalNeeded = sprint1Specialists.length + sprint2Specialists.length;
  console.log(`\n🏁 OVERALL SUCCESS RATE: ${totalSuccess}/${totalNeeded} (${(totalSuccess/totalNeeded*100).toFixed(0)}%)`);
  
  if (totalSuccess === totalNeeded) {
    console.log('🏁 ALL SPECIALISTS READY FOR PRODUCTION!');
  } else {
    console.log(`📝 ${totalNeeded - totalSuccess} specialists still need implementation or fixes`);
  }
}

// Run test
testSprint2Specialists().catch(console.error);