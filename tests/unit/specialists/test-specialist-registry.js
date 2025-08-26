#!/usr/bin/env node

/**
 * Test Specialist Registry - Sprint 2
 * Verify all specialists load and can be instantiated
 */

const { logger } = require('../src/core/logging/bumba-logger');

console.log('\n========================================');
console.log('BUMBA SPECIALIST REGISTRY TEST');
console.log('Sprint 2: Fix specialist registry');
console.log('========================================\n');

async function testSpecialistRegistry() {
  let specialistRegistry;
  
  try {
    // Test 1: Load the registry
    console.log('🟢 Test 1: Loading specialist registry...');
    specialistRegistry = require('../src/core/specialists/specialist-registry');
    console.log('🏁 Registry loaded successfully!\n');
    
    // Test 2: Get all specialist types
    console.log('🟢 Test 2: Getting all specialist types...');
    const allTypes = specialistRegistry.getAllTypes();
    console.log(`🏁 Found ${allTypes.length} specialist types:\n`);
    
    // Group specialists by category
    const categories = {
      database: [],
      frontend: [],
      backend: [],
      devops: [],
      business: [],
      security: [],
      ai_data: [],
      qa: [],
      experience: [],
      strategic: [],
      other: []
    };
    
    allTypes.forEach(type => {
      if (type.includes('database') || type.includes('postgres') || type.includes('mongo')) {
        categories.database.push(type);
      } else if (type.includes('frontend') || type.includes('react') || type.includes('vue')) {
        categories.frontend.push(type);
      } else if (type.includes('backend') || type.includes('javascript') || type.includes('python') || type.includes('golang') || type.includes('rust')) {
        categories.backend.push(type);
      } else if (type.includes('devops') || type.includes('cloud') || type.includes('kubernetes') || type.includes('sre')) {
        categories.devops.push(type);
      } else if (type.includes('product') || type.includes('project') || type.includes('writer')) {
        categories.business.push(type);
      } else if (type.includes('security')) {
        categories.security.push(type);
      } else if (type.includes('data') || type.includes('ml') || type.includes('ai')) {
        categories.ai_data.push(type);
      } else if (type.includes('qa') || type.includes('test') || type.includes('debug') || type.includes('review')) {
        categories.qa.push(type);
      } else if (type.includes('ux') || type.includes('experience') || type.includes('accessibility')) {
        categories.experience.push(type);
      } else if (type.includes('market') || type.includes('competitive') || type.includes('business-model')) {
        categories.strategic.push(type);
      } else {
        categories.other.push(type);
      }
    });
    
    // Display categorized specialists
    console.log('🟢 Specialists by Category:');
    Object.entries(categories).forEach(([category, specialists]) => {
      if (specialists.length > 0) {
        console.log(`\n${category.toUpperCase().replace('_', '/')} (${specialists.length}):`);
        specialists.forEach(s => console.log(`  • ${s}`));
      }
    });
    
    // Test 3: Test instantiation of each specialist
    console.log('\n\n🟢 Test 3: Testing specialist instantiation...');
    
    let successCount = 0;
    let failCount = 0;
    const failures = [];
    
    for (const type of allTypes) {
      try {
        const specialist = specialistRegistry.getSpecialist(type);
        if (specialist) {
          successCount++;
          process.stdout.write('🏁');
        } else {
          failCount++;
          failures.push({ type, error: 'Returned null' });
          process.stdout.write('🟢');
        }
      } catch (error) {
        failCount++;
        failures.push({ type, error: error.message });
        process.stdout.write('🟢');
      }
    }
    
    console.log('\n');
    console.log(`\n🏁 Successfully instantiated: ${successCount}/${allTypes.length}`);
    if (failCount > 0) {
      console.log(`🔴 Failed to instantiate: ${failCount}/${allTypes.length}`);
      console.log('\nFailures:');
      failures.forEach(f => {
        console.log(`  • ${f.type}: ${f.error}`);
      });
    }
    
    // Test 4: Test specialist capabilities
    console.log('\n🟢 Test 4: Testing specialist capabilities...');
    
    const testTasks = [
      'Create a React component with hooks',
      'Optimize PostgreSQL query performance',
      'Implement CI/CD pipeline with Docker',
      'Design user authentication system',
      'Conduct market research for new feature',
      'Write unit tests for API endpoints'
    ];
    
    for (const task of testTasks) {
      console.log(`\n🟢 Task: "${task}"`);
      const matches = specialistRegistry.findSpecialistsForTask(task);
      if (matches && matches.length > 0) {
        console.log(`  Found ${matches.length} specialists:`);
        matches.slice(0, 3).forEach(match => {
          console.log(`    • ${match.type} (confidence: ${(match.confidence * 100).toFixed(0)}%)`);
        });
      } else {
        console.log('  🟡 No specialists found for this task');
      }
    }
    
    // Test 5: Test specialist info retrieval
    console.log('\n🟢 Test 5: Testing specialist info retrieval...');
    
    const sampleTypes = ['react-specialist', 'security-specialist', 'market-research', 'devops-engineer'];
    
    for (const type of sampleTypes) {
      const info = specialistRegistry.getSpecialistInfo(type);
      if (info) {
        console.log(`\n${type}:`);
        console.log(`  Name: ${info.name}`);
        console.log(`  Skills: ${info.skills.slice(0, 3).join(', ')}${info.skills.length > 3 ? '...' : ''}`);
        console.log(`  Tools: ${info.tools.slice(0, 3).join(', ')}${info.tools.length > 3 ? '...' : ''}`);
        console.log(`  Specialized: ${info.specialized ? 'Yes' : 'No'}`);
        if (info.personaBased) {
          console.log(`  Persona-based: Yes`);
        }
      } else {
        console.log(`\n🟡 Could not get info for ${type}`);
      }
    }
    
    // Summary
    console.log('\n\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Total Specialists: ${allTypes.length}`);
    console.log(`Successfully Loaded: ${successCount}`);
    console.log(`Failed to Load: ${failCount}`);
    console.log(`Success Rate: ${((successCount / allTypes.length) * 100).toFixed(1)}%`);
    
    if (successCount === allTypes.length) {
      console.log('\n🏁 ALL SPECIALISTS LOADED SUCCESSFULLY!');
      console.log('Sprint 2 COMPLETE: Specialist registry fixed!\n');
      return true;
    } else {
      console.log('\n🟡 Some specialists failed to load.');
      console.log('Sprint 2 PARTIALLY COMPLETE: Registry needs more fixes.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n🔴 CRITICAL ERROR:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testSpecialistRegistry().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});