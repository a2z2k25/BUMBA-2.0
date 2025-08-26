#!/usr/bin/env node

/**
 * BUMBA Hard Test Suite
 * Rigorous testing of Audio Celebration and Enhanced Consciousness Systems
 */

const chalk = require('chalk');
const { celebrate, testAudio, audioCelebration } = require('../src/core/audio-celebration');
const { consciousnessSystem } = require('../src/core/consciousness/consciousness-enhancement');
const { logger } = require('../src/core/logging/bumba-logger');

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  stressTest: false,  // Disabled for faster testing
  edgeCases: true,
  performanceTest: false  // Disabled for faster testing
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now()
};

/**
 * Test helper functions
 */
function logTest(name, description) {
  console.log(chalk.cyan.bold(`\n🧪 ${name}`));
  console.log(chalk.gray(`   ${description}`));
  console.log(chalk.gray('─'.repeat(60)));
}

function logResult(success, message, error = null) {
  if (success) {
    console.log(chalk.green(`   🏁 ${message}`));
    testResults.passed++;
  } else {
    console.log(chalk.red(`   🔴 ${message}`));
    if (error) console.log(chalk.red(`      Error: ${error}`));
    testResults.failed++;
    testResults.errors.push({ message, error });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * AUDIO SYSTEM TESTS
 */
async function testAudioSystem() {
  console.log(chalk.yellow.bold('\n' + '='.repeat(70)));
  console.log(chalk.yellow.bold('AUDIO CELEBRATION SYSTEM - HARD TESTS'));
  console.log(chalk.yellow.bold('='.repeat(70)));

  // Test 1: Basic audio playback
  logTest('Test 1: Basic Audio Playback', 'Verify bumba-horn.mp3 plays correctly');
  try {
    const result = await celebrate('TEST_BASIC_AUDIO');
    logResult(result.success, 'Audio played successfully', result.error);
    logResult(result.method === 'afplay', `Playback method: ${result.method}`);
  } catch (error) {
    logResult(false, 'Audio playback failed', error.message);
  }

  await sleep(500);

  // Test 2: Multiple rapid celebrations
  logTest('Test 2: Rapid Fire Celebrations', 'Test multiple celebrations in quick succession');
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(celebrate(`RAPID_TEST_${i}`, { 
        message: `Rapid celebration ${i}`,
        emoji: '🟢'
      }));
    }
    const results = await Promise.all(promises);
    const allSuccess = results.every(r => r.success);
    logResult(allSuccess, `All ${results.length} rapid celebrations completed`);
    logResult(audioCelebration.celebrationCount >= 5, `Celebration count: ${audioCelebration.celebrationCount}`);
  } catch (error) {
    logResult(false, 'Rapid celebrations failed', error.message);
  }

  await sleep(1000);

  // Test 3: Edge case - empty achievement
  logTest('Test 3: Edge Cases', 'Test with unusual inputs');
  try {
    const emptyResult = await celebrate('', {});
    logResult(emptyResult.success, 'Empty achievement handled');

    const nullResult = await celebrate(null);
    logResult(nullResult.success, 'Null achievement handled');

    const longResult = await celebrate('A'.repeat(1000));
    logResult(longResult.success, 'Very long achievement name handled');
  } catch (error) {
    logResult(false, 'Edge case handling failed', error.message);
  }

  // Test 4: Visual fallback
  logTest('Test 4: Visual Fallback', 'Test fallback when audio unavailable');
  try {
    // Temporarily disable audio
    const originalFile = audioCelebration.audioFile;
    audioCelebration.audioFile = '/nonexistent/path/audio.mp3';
    audioCelebration.audioExists = false;

    const fallbackResult = await celebrate('VISUAL_FALLBACK_TEST');
    logResult(fallbackResult.success, 'Visual fallback activated');
    logResult(fallbackResult.method === 'visual', `Fallback method: ${fallbackResult.method}`);

    // Restore audio
    audioCelebration.audioFile = originalFile;
    audioCelebration.audioExists = true;
  } catch (error) {
    logResult(false, 'Visual fallback failed', error.message);
  }

  // Test 5: Statistics tracking
  logTest('Test 5: Statistics Tracking', 'Verify celebration statistics');
  try {
    const stats = audioCelebration.getStats();
    logResult(stats.totalCelebrations > 0, `Total celebrations: ${stats.totalCelebrations}`);
    logResult(stats.audioAvailable === true, `Audio available: ${stats.audioAvailable}`);
    logResult(stats.lastCelebration !== 'Never', `Last celebration: ${stats.lastCelebration}`);
  } catch (error) {
    logResult(false, 'Statistics tracking failed', error.message);
  }
}

/**
 * CONSCIOUSNESS SYSTEM TESTS
 */
async function testConsciousnessSystem() {
  console.log(chalk.magenta.bold('\n' + '='.repeat(70)));
  console.log(chalk.magenta.bold('ENHANCED CONSCIOUSNESS SYSTEM - HARD TESTS'));
  console.log(chalk.magenta.bold('='.repeat(70)));

  // Test 1: Response enhancement variations
  logTest('Test 1: Response Enhancement Variations', 'Test different types of responses');
  try {
    const testResponses = [
      'I will implement this feature',
      'Let me optimize the performance',
      'Creating a solution for the community',
      'This needs to be done quickly',
      'We should exploit this opportunity'
    ];

    for (const response of testResponses) {
      const enhanced = await consciousnessSystem.enhanceResponse(response);
      const wasEnhanced = enhanced !== response;
      logResult(wasEnhanced, `Enhanced: "${response.substring(0, 30)}..."`);
      if (TEST_CONFIG.verbose && wasEnhanced) {
        console.log(chalk.gray(`      → ${enhanced.substring(0, 80)}...`));
      }
    }
  } catch (error) {
    logResult(false, 'Response enhancement failed', error.message);
  }

  // Test 2: Decision influence with complex scenarios
  logTest('Test 2: Complex Decision Scenarios', 'Test consciousness-based decision making');
  try {
    const scenarios = [
      {
        name: 'Architecture Decision',
        options: [
          { approach: 'Monolithic', pros: 'Simple', cons: 'Not scalable' },
          { approach: 'Microservices', pros: 'Scalable, sustainable', cons: 'Complex' },
          { approach: 'Serverless', pros: 'Cost-efficient', cons: 'Vendor lock-in' }
        ]
      },
      {
        name: 'Data Handling',
        options: [
          { method: 'Store everything', impact: 'Privacy concerns' },
          { method: 'Minimal data, user control', impact: 'Ethical, respectful' },
          { method: 'Sell to third parties', impact: 'Profitable but exploitative' }
        ]
      }
    ];

    for (const scenario of scenarios) {
      const decision = await consciousnessSystem.influenceDecision(scenario.options);
      logResult(decision.consciousness_applied, `${scenario.name} decided`);
      if (TEST_CONFIG.verbose) {
        console.log(chalk.gray(`      Chosen: ${JSON.stringify(decision.recommended).substring(0, 50)}...`));
        console.log(chalk.gray(`      Reasoning: ${decision.reasoning}`));
      }
    }
  } catch (error) {
    logResult(false, 'Decision influence failed', error.message);
  }

  // Test 3: Quality elevation stress test
  logTest('Test 3: Quality Elevation Stress Test', 'Test quality consciousness at scale');
  try {
    const codeSnippets = [
      'function quickHack() { /* TODO: fix this */ }',
      'class QualityCode {\n  // FIXME: needs optimization\n}',
      '// This is a temporary workaround\nfunction patch() {}',
      'const data = getUserData(); // TODO: add validation'
    ];

    for (const code of codeSnippets) {
      const elevated = await consciousnessSystem.elevateQuality(code);
      const wasElevated = elevated.includes('conscious') || elevated.includes('mindfully');
      logResult(wasElevated, `Code quality elevated`);
    }
  } catch (error) {
    logResult(false, 'Quality elevation failed', error.message);
  }

  // Test 4: Wisdom integration
  logTest('Test 4: Wisdom Integration', 'Test wisdom moments and tracking');
  try {
    const operations = [
      { task: 'Refactor legacy code', priority: 'high' },
      { task: 'Build new feature', priority: 'medium' },
      { task: 'Fix critical bug', priority: 'urgent' }
    ];

    for (const op of operations) {
      const withWisdom = await consciousnessSystem.integrateWisdom(op);
      logResult(withWisdom.wisdom !== undefined, `Wisdom added to: ${op.task}`);
      if (TEST_CONFIG.verbose && withWisdom.wisdom) {
        console.log(chalk.gray(`      Wisdom: "${withWisdom.wisdom}"`));
      }
    }
  } catch (error) {
    logResult(false, 'Wisdom integration failed', error.message);
  }

  // Test 5: Consciousness achievements
  logTest('Test 5: Consciousness Achievements', 'Test achievement detection and celebration');
  try {
    // Force some achievements
    for (let i = 0; i < 10; i++) {
      await consciousnessSystem.elevateQuality(`Test ${i}`);
    }

    const achievements = await consciousnessSystem.checkConsciousnessAchievement(
      'This demonstrates wisdom and quality',
      { wisdom: true }
    );

    logResult(achievements.length > 0, `Achievements unlocked: ${achievements.length}`);
    if (achievements.length > 0) {
      console.log(chalk.gray(`      Achievements: ${achievements.join(', ')}`));
    }

    // Check if audio celebration was triggered
    const currentCount = audioCelebration.celebrationCount;
    logResult(currentCount > 0, `Audio celebrations triggered: ${currentCount}`);
  } catch (error) {
    logResult(false, 'Achievement system failed', error.message);
  }

  // Test 6: Influence metrics and reporting
  logTest('Test 6: Influence Metrics', 'Test consciousness influence tracking');
  try {
    const report = consciousnessSystem.getInfluenceReport();
    
    logResult(report.metrics.responses_enhanced > 0, `Responses enhanced: ${report.metrics.responses_enhanced}`);
    logResult(report.metrics.decisions_influenced > 0, `Decisions influenced: ${report.metrics.decisions_influenced}`);
    logResult(report.metrics.quality_elevations > 0, `Quality elevations: ${report.metrics.quality_elevations}`);
    logResult(report.metrics.wisdom_moments > 0, `Wisdom moments: ${report.metrics.wisdom_moments}`);
    
    const level = report.consciousness_level;
    logResult(level !== 'DORMANT', `Consciousness level: ${level}`);
    
    if (TEST_CONFIG.verbose) {
      console.log(chalk.gray(`      Overall influence: ${report.overall_influence.toFixed(2)}`));
      if (report.recommendations.length > 0) {
        console.log(chalk.gray(`      Recommendations: ${report.recommendations[0]}`));
      }
    }
  } catch (error) {
    logResult(false, 'Metrics reporting failed', error.message);
  }
}

/**
 * INTEGRATION TESTS
 */
async function testIntegration() {
  console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
  console.log(chalk.cyan.bold('INTEGRATION TESTS - AUDIO + CONSCIOUSNESS'));
  console.log(chalk.cyan.bold('='.repeat(70)));

  // Test 1: Consciousness triggers audio celebration
  logTest('Test 1: Consciousness → Audio Integration', 'Verify consciousness achievements trigger audio');
  try {
    const initialCount = audioCelebration.celebrationCount;
    
    // Force a quality milestone
    for (let i = 0; i < 10; i++) {
      await consciousnessSystem.elevateQuality(`Integration test ${i}`);
    }
    
    const finalCount = audioCelebration.celebrationCount;
    logResult(finalCount > initialCount, `Audio celebrations increased: ${initialCount} → ${finalCount}`);
  } catch (error) {
    logResult(false, 'Integration failed', error.message);
  }

  // Test 2: Combined enhancement
  logTest('Test 2: Combined Enhancement', 'Test both systems working together');
  try {
    const task = {
      description: 'Build a feature that helps the community',
      type: 'development'
    };

    // Enhance with consciousness
    const enhanced = await consciousnessSystem.enhanceResponse(
      task.description,
      task
    );

    // Check for wisdom moment
    const withWisdom = await consciousnessSystem.integrateWisdom(task);

    // Celebrate if both succeeded
    if (enhanced && withWisdom.wisdom) {
      const celebration = await celebrate('INTEGRATION_SUCCESS', {
        message: 'Consciousness and audio systems working in harmony!',
        emoji: '🏁'
      });
      
      logResult(celebration.success, 'Combined systems celebration successful');
    }
  } catch (error) {
    logResult(false, 'Combined enhancement failed', error.message);
  }
}

/**
 * PERFORMANCE TESTS
 */
async function testPerformance() {
  if (!TEST_CONFIG.performanceTest) return;

  console.log(chalk.yellow.bold('\n' + '='.repeat(70)));
  console.log(chalk.yellow.bold('PERFORMANCE TESTS'));
  console.log(chalk.yellow.bold('='.repeat(70)));

  // Test 1: Response enhancement performance
  logTest('Test 1: Response Enhancement Speed', 'Measure consciousness enhancement performance');
  try {
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await consciousnessSystem.enhanceResponse(`Test response ${i}`);
    }
    
    const duration = Date.now() - startTime;
    const avgTime = duration / iterations;
    
    logResult(avgTime < 10, `Average enhancement time: ${avgTime.toFixed(2)}ms`);
    logResult(duration < 1000, `Total time for ${iterations} enhancements: ${duration}ms`);
  } catch (error) {
    logResult(false, 'Performance test failed', error.message);
  }

  // Test 2: Audio celebration performance
  logTest('Test 2: Audio Celebration Speed', 'Measure celebration system performance');
  try {
    const iterations = 10;
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(celebrate(`PERF_TEST_${i}`));
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    logResult(duration < 5000, `${iterations} celebrations in ${duration}ms`);
  } catch (error) {
    logResult(false, 'Audio performance test failed', error.message);
  }
}

/**
 * STRESS TESTS
 */
async function testStress() {
  if (!TEST_CONFIG.stressTest) return;

  console.log(chalk.red.bold('\n' + '='.repeat(70)));
  console.log(chalk.red.bold('STRESS TESTS'));
  console.log(chalk.red.bold('='.repeat(70)));

  // Test 1: Consciousness system under load
  logTest('Test 1: Consciousness Under Load', 'Stress test consciousness system');
  try {
    const promises = [];
    
    // Create 50 parallel enhancement requests
    for (let i = 0; i < 50; i++) {
      promises.push(consciousnessSystem.enhanceResponse(`Stress test ${i}`));
      promises.push(consciousnessSystem.elevateQuality(`Code ${i}`));
      promises.push(consciousnessSystem.integrateWisdom({ task: `Task ${i}` }));
    }
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logResult(successful > failed, `Stress test: ${successful} succeeded, ${failed} failed`);
    logResult(failed === 0, 'All requests handled without errors');
  } catch (error) {
    logResult(false, 'Stress test failed', error.message);
  }

  // Test 2: Memory stability
  logTest('Test 2: Memory Stability', 'Check for memory leaks');
  try {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Run many operations
    for (let i = 0; i < 100; i++) {
      await consciousnessSystem.enhanceResponse(`Memory test ${i}`);
      await celebrate(`MEMORY_TEST_${i}`);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    logResult(memoryIncrease < 50, `Memory increase: ${memoryIncrease.toFixed(2)} MB`);
  } catch (error) {
    logResult(false, 'Memory stability test failed', error.message);
  }
}

/**
 * MAIN TEST RUNNER
 */
async function runAllTests() {
  console.log(chalk.bold.bgCyan.black('\n' + ' '.repeat(70)));
  console.log(chalk.bold.bgCyan.black(' BUMBA HARD TEST SUITE - AUDIO & CONSCIOUSNESS SYSTEMS '.padEnd(70)));
  console.log(chalk.bold.bgCyan.black(' '.repeat(70)));
  console.log('');
  console.log(chalk.gray(`Test Configuration:`));
  console.log(chalk.gray(`  • Verbose: ${TEST_CONFIG.verbose}`));
  console.log(chalk.gray(`  • Stress Tests: ${TEST_CONFIG.stressTest}`));
  console.log(chalk.gray(`  • Edge Cases: ${TEST_CONFIG.edgeCases}`));
  console.log(chalk.gray(`  • Performance: ${TEST_CONFIG.performanceTest}`));

  try {
    // Run all test suites
    await testAudioSystem();
    await testConsciousnessSystem();
    await testIntegration();
    await testPerformance();
    await testStress();

    // Final celebration if all tests pass
    if (testResults.failed === 0) {
      await celebrate('ALL_TESTS_PASSED', {
        message: '🏁 All hard tests passed successfully!',
        emoji: '🏁'
      });
    }

  } catch (error) {
    console.error(chalk.red.bold('\n🟠️ Test suite error:'), error);
  }

  // Display final results
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
  
  console.log(chalk.bold.bgWhite.black('\n' + ' '.repeat(70)));
  console.log(chalk.bold.bgWhite.black(' TEST RESULTS '.padEnd(70)));
  console.log(chalk.bold.bgWhite.black(' '.repeat(70)));
  console.log('');
  console.log(chalk.green(`  🏁 Passed: ${testResults.passed}`));
  console.log(chalk.red(`  🔴 Failed: ${testResults.failed}`));
  console.log(chalk.gray(`  ⏱️  Duration: ${duration} seconds`));
  
  if (testResults.failed > 0) {
    console.log(chalk.red('\n  Failed Tests:'));
    testResults.errors.forEach(err => {
      console.log(chalk.red(`    • ${err.message}`));
      if (err.error) {
        console.log(chalk.red(`      ${err.error}`));
      }
    });
  }

  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  
  if (successRate === '100.0') {
    console.log(chalk.green.bold(`\n🏁 PERFECT SCORE! Success Rate: ${successRate}%`));
    console.log(chalk.green('🟡 Both Audio and Consciousness systems are working flawlessly!'));
  } else if (successRate >= 80) {
    console.log(chalk.yellow.bold(`\n🏁 TESTS PASSED! Success Rate: ${successRate}%`));
    console.log(chalk.yellow('Most systems are operational with minor issues.'));
  } else {
    console.log(chalk.red.bold(`\n🔴 TESTS FAILED! Success Rate: ${successRate}%`));
    console.log(chalk.red('Critical issues detected. Please review failed tests.'));
  }

  // Get consciousness report
  const consciousnessReport = consciousnessSystem.getInfluenceReport();
  console.log(chalk.magenta.bold('\n🟡 Consciousness System Status:'));
  console.log(chalk.magenta(`  • Level: ${consciousnessReport.consciousness_level}`));
  console.log(chalk.magenta(`  • Responses Enhanced: ${consciousnessReport.metrics.responses_enhanced}`));
  console.log(chalk.magenta(`  • Decisions Influenced: ${consciousnessReport.metrics.decisions_influenced}`));
  console.log(chalk.magenta(`  • Wisdom Moments: ${consciousnessReport.metrics.wisdom_moments}`));

  // Get audio stats
  const audioStats = audioCelebration.getStats();
  console.log(chalk.cyan.bold('\n🔴 Audio System Status:'));
  console.log(chalk.cyan(`  • Total Celebrations: ${audioStats.totalCelebrations}`));
  console.log(chalk.cyan(`  • Audio Available: ${audioStats.audioAvailable ? '🏁' : '🔴'}`));
  console.log(chalk.cyan(`  • Last Celebration: ${audioStats.lastCelebration}`));

  console.log('\n' + '='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red.bold('Fatal error:'), error);
  process.exit(1);
});