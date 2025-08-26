/**
 * Simple Specialist Integration Test
 * Tests basic functionality without logger dependency
 */

// Mock the logger to avoid initialization issues
const mockLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: () => {}
};

// Override require for logger
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.includes('bumba-logger')) {
    return { logger: mockLogger };
  }
  return originalRequire.apply(this, arguments);
};

// Now we can load our modules
const { BumbaPersonaEngine } = require('../core/persona/persona-engine');

async function runSimpleTest() {
  console.log('🏁 BUMBA Enhanced Specialist Simple Test');
  console.log('========================================\n');

  try {
    // Test 1: Load persona engine
    const personaEngine = new BumbaPersonaEngine();
    console.log('🏁 Persona engine loaded successfully\n');

    // Test 2: Get all specialists
    const allSpecialists = personaEngine.getAllSpecialists();
    console.log(`🏁 Total specialists loaded: ${allSpecialists.length}\n`);

    // Test 3: List all specialists by category
    const specialistsByCategory = personaEngine.getSpecialistsByCategory();
    console.log('Specialists by Category:');
    console.log('------------------------');
    
    for (const [category, specialists] of Object.entries(specialistsByCategory)) {
      console.log(`\n${category.toUpperCase()}:`);
      for (const specialist of specialists) {
        const persona = personaEngine.getPersona(null, specialist);
        if (persona) {
          console.log(`  🏁 ${specialist}: ${persona.name} - ${persona.role}`);
        } else {
          console.log(`  🔴 ${specialist}: No persona found`);
        }
      }
    }

    // Test 4: Test specialist recommendations
    console.log('\n\nSpecialist Recommendations Test:');
    console.log('--------------------------------');
    
    const testScenarios = [
      {
        manager: 'technical',
        task: { description: 'Build a Python machine learning API with cloud deployment' }
      },
      {
        manager: 'experience',
        task: { description: 'Design an accessible mobile user interface' }
      },
      {
        manager: 'strategic',
        task: { description: 'Create technical documentation and project timeline' }
      }
    ];

    for (const scenario of testScenarios) {
      const recommendations = personaEngine.getSpecialistSpawningRecommendations(
        scenario.manager,
        scenario.task
      );
      console.log(`\n${scenario.manager.toUpperCase()} Manager:`);
      console.log(`Task: "${scenario.task.description}"`);
      console.log(`Recommendations: ${recommendations.length > 0 ? recommendations.join(', ') : 'None'}`);
    }

    // Summary
    console.log('\n\n🏁 All tests completed successfully!');
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Total Specialists: ${allSpecialists.length}`);
    console.log(`Categories: ${Object.keys(specialistsByCategory).length}`);
    console.log(`Language Specialists: ${specialistsByCategory.language.length}`);
    console.log(`Quality Specialists: ${specialistsByCategory.quality.length}`);
    console.log(`DevOps Specialists: ${specialistsByCategory.devops.length}`);
    console.log(`Business Specialists: ${specialistsByCategory.business.length}`);
    console.log(`Data/AI Specialists: ${specialistsByCategory.data_ai.length}`);
    console.log(`Advanced Specialists: ${specialistsByCategory.advanced.length}`);

  } catch (error) {
    console.error('🔴 Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runSimpleTest();