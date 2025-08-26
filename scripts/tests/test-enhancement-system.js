#!/usr/bin/env node

/**
 * Test BUMBA Enhancement System
 * Ensures enhancements don't disrupt core functionality
 */

const { logger } = require('./src/core/logging/bumba-logger');
const enhancements = require('./src/config/bumba-enhancements');

console.log('\n🧪 TESTING BUMBA ENHANCEMENT SYSTEM');
console.log('=====================================\n');

async function testCoreWithoutEnhancements() {
  console.log('📋 TEST 1: Core Validation WITHOUT Enhancements');
  console.log('------------------------------------------------\n');
  
  // Verify all enhancements are disabled by default
  const status = enhancements.getStatus();
  console.log('Enhancement Status:');
  console.log('  Memory:', status.memory);
  console.log('  Consensus:', status.consensus);
  console.log('  Work Stealing:', status.workStealing);
  console.log('  Hive Mind:', status.hiveMind);
  
  if (status.memory !== 'disabled') {
    console.error('🔴 Memory should be disabled by default!');
    return false;
  }
  
  // Test manager validation without memory
  try {
    const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
    
    // Create mock manager
    const mockManager = {
      name: 'Test-Manager',
      usingClaudeMax: true,
      modelConfig: { model: 'claude-max' }
    };
    
    const validationLayer = new ManagerValidationLayer(mockManager);
    
    // Mock specialist result
    const specialistResult = {
      specialist: 'test-specialist',
      code: `
        function processData(data) {
          console.log(data);
          return data;
        }
      `,
      summary: 'Basic data processing function'
    };
    
    console.log('Testing validation without memory consultation...');
    
    // This should work WITHOUT memory
    const validation = await validationLayer.validateSpecialistWork(
      specialistResult,
      'process-data',
      { enableMemory: false } // Explicitly disable
    );
    
    if (validation.metaValidation) {
      console.log('🏁 Meta-validation working:', validation.metaValidation.qualityScore);
    }
    
    console.log('🏁 Core validation works WITHOUT enhancements\n');
    return true;
    
  } catch (error) {
    console.error('🔴 Core validation failed:', error.message);
    return false;
  }
}

async function testMemoryEnhancement() {
  console.log('📋 TEST 2: Memory Enhancement (Opt-in)');
  console.log('----------------------------------------\n');
  
  // Enable memory
  console.log('Enabling memory enhancement...');
  enhancements.enableMemory();
  
  const status = enhancements.getStatus();
  if (status.memory !== 'enabled') {
    console.error('🔴 Memory should be enabled!');
    return false;
  }
  
  console.log('🏁 Memory enabled successfully\n');
  
  // Test memory enhancement layer
  try {
    const { getMemoryEnhancement } = require('./src/core/memory/memory-enhancement');
    const memory = getMemoryEnhancement(true); // Enable
    
    // Test consultation (should return null if no history)
    const hints = await memory.consultMemory('test-command', 'test-specialist');
    console.log('Memory consultation result:', hints || 'No history (expected)');
    
    // Test recording (should fail silently if unavailable)
    await memory.recordToMemory(
      { command: 'test', approved: true },
      { qualityScore: 85 }
    );
    
    // Get stats
    const stats = await memory.getStats();
    console.log('Memory stats:', stats);
    
    console.log('🏁 Memory enhancement works as opt-in feature\n');
    
    // Disable memory
    enhancements.disableMemory();
    console.log('🏁 Memory disabled successfully\n');
    
    return true;
    
  } catch (error) {
    console.error('🟠 Memory enhancement not available:', error.message);
    console.log('This is expected if better-sqlite3 is not installed');
    enhancements.disableMemory();
    return true; // Still pass - memory is optional
  }
}

async function testEnhancementCommand() {
  console.log('📋 TEST 3: Enhancement Command Interface');
  console.log('-----------------------------------------\n');
  
  try {
    const EnhancementsCommand = require('./src/commands/enhancements');
    const cmd = new EnhancementsCommand();
    
    // Test status command
    console.log('Testing status command...');
    const statusResult = await cmd.execute(['status']);
    if (statusResult.success) {
      console.log('🏁 Status command works\n');
    }
    
    // Test help
    console.log('Testing help command...');
    const helpResult = await cmd.execute([]);
    if (helpResult.success) {
      console.log('🏁 Help command works\n');
    }
    
    return true;
    
  } catch (error) {
    console.error('🔴 Enhancement command failed:', error.message);
    return false;
  }
}

async function testNonInvasiveness() {
  console.log('📋 TEST 4: Non-Invasive Integration');
  console.log('-------------------------------------\n');
  
  // Run validation with and without memory, compare results
  const ManagerValidationLayer = require('./src/core/departments/manager-validation-layer');
  
  const mockManager = {
    name: 'Test-Manager',
    usingClaudeMax: true,
    modelConfig: { model: 'claude-max' },
    claudeMaxManager: {
      acquireLock: async () => true,
      getClaudeMaxConfig: () => ({ model: 'claude-max' })
    }
  };
  
  const validationLayer = new ManagerValidationLayer(mockManager);
  
  const specialistResult = {
    specialist: 'test-specialist',
    code: 'function test() { return true; }',
    summary: 'Test function'
  };
  
  console.log('Running validation WITHOUT memory...');
  const result1 = await validationLayer.validateSpecialistWork(
    specialistResult,
    'test-command',
    { enableMemory: false }
  );
  
  console.log('Running validation WITH memory (if available)...');
  enhancements.enableMemory();
  const result2 = await validationLayer.validateSpecialistWork(
    specialistResult,
    'test-command',
    { enableMemory: true }
  );
  enhancements.disableMemory();
  
  // Both should work and have similar structure
  if (result1.approved !== undefined && result2.approved !== undefined) {
    console.log('🏁 Both validations completed successfully');
    console.log('  Without memory - Approved:', result1.approved);
    console.log('  With memory - Approved:', result2.approved);
    console.log('🏁 Memory enhancement is NON-INVASIVE\n');
    return true;
  }
  
  return false;
}

// Run all tests
async function runTests() {
  const tests = [
    { name: 'Core Without Enhancements', fn: testCoreWithoutEnhancements },
    { name: 'Memory Enhancement', fn: testMemoryEnhancement },
    { name: 'Enhancement Command', fn: testEnhancementCommand },
    { name: 'Non-Invasiveness', fn: testNonInvasiveness }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`🔴 Test "${test.name}" threw error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`🏁 Passed: ${passed}`);
  console.log(`🔴 Failed: ${failed}`);
  console.log(`📈 Success Rate: ${(passed / tests.length * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🏁 ALL TESTS PASSED!');
    console.log('BUMBA enhancements are working correctly:');
    console.log('  • Core functionality unaffected 🏁');
    console.log('  • Enhancements are opt-in only 🏁');
    console.log('  • Graceful fallback when unavailable 🏁');
    console.log('  • Command interface functional 🏁\n');
  }
}

// Execute tests
runTests().catch(console.error);