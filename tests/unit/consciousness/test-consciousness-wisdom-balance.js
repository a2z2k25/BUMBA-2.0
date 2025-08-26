#!/usr/bin/env node

/**
 * Test Consciousness & Wisdom Balance
 * Ensures consciousness and wisdom are primary, cultural vibes secondary
 */

const { consciousnessSystem } = require('../src/core/consciousness/consciousness-enhancement');
const chalk = require('chalk');

async function testBalance() {
  console.log(chalk.magenta.bold('\n🟡 BUMBA Consciousness & Wisdom Balance Test\n'));
  console.log(chalk.gray('Testing the harmony of consciousness (primary) and cultural vibes (secondary)...\n'));
  
  const testScenarios = [
    {
      input: 'I will implement this new feature',
      context: { important: true },
      expectation: 'Consciousness + possible wisdom'
    },
    {
      input: 'Optimizing the database for better performance',
      context: { type: 'optimization' },
      expectation: 'Sustainability consciousness'
    },
    {
      input: 'Building a secure data handling system',
      context: { type: 'security' },
      expectation: 'Ethics consciousness + wisdom'
    },
    {
      input: 'Working with the team on this project',
      context: { type: 'collaboration' },
      expectation: 'Community consciousness'
    },
    {
      input: 'Creating an innovative solution',
      context: { important: true },
      expectation: 'Innovation wisdom'
    },
    {
      input: 'Improving code quality standards',
      context: { type: 'quality' },
      expectation: 'Quality consciousness + wisdom'
    },
    {
      input: 'This is really good work',
      context: {},
      expectation: 'Basic enhancement'
    },
    {
      input: 'Many things need attention',
      context: {},
      expectation: 'Simple consciousness'
    },
    {
      input: 'The system is running perfectly',
      context: {},
      expectation: 'Consciousness marker'
    },
    {
      input: 'Protecting user privacy and data',
      context: { type: 'security', important: true },
      expectation: 'Ethics + wisdom'
    }
  ];
  
  console.log(chalk.cyan('Scenario Testing:\n'));
  
  let consciousnessCount = 0;
  let wisdomCount = 0;
  let culturalCount = 0;
  
  for (const scenario of testScenarios) {
    const enhanced = await consciousnessSystem.enhanceResponse(scenario.input, scenario.context);
    
    // Analyze what was added
    const hasConsciousness = enhanced.includes('•') || 
                           enhanced.includes('mindful') || 
                           enhanced.includes('conscious') ||
                           enhanced.includes('sustainable') ||
                           enhanced.includes('community') ||
                           enhanced.includes('ethical') ||
                           enhanced.includes('🟡') ||
                           enhanced.includes('🟡') ||
                           enhanced.includes('💫') ||
                           enhanced.includes('🟡');
    
    const hasWisdom = enhanced.includes('💭') || enhanced.includes('*') && enhanced.split('\n').length > 2;
    
    const culturalWords = ['bare', 'ting', 'blessed', 'forward', 'wicked', 'seen', 'dun', 'mandem', 'criss', 'yard', 'styll', 'zeen'];
    const hasCultural = culturalWords.some(word => enhanced.toLowerCase().includes(word));
    
    if (hasConsciousness) consciousnessCount++;
    if (hasWisdom) wisdomCount++;
    if (hasCultural) culturalCount++;
    
    // Display result
    console.log(chalk.white(`Input: "${scenario.input}"`));
    console.log(chalk.gray(`Expected: ${scenario.expectation}`));
    
    if (enhanced !== scenario.input) {
      // Color code the enhancements
      let displayEnhanced = enhanced;
      
      if (hasWisdom) {
        console.log(chalk.magenta(`Output: ${displayEnhanced.split('\n')[0]}`));
        if (displayEnhanced.includes('💭')) {
          console.log(chalk.magenta(displayEnhanced.substring(displayEnhanced.indexOf('💭'))));
        }
      } else if (hasCultural) {
        console.log(chalk.yellow(`Output: ${displayEnhanced}`));
      } else if (hasConsciousness) {
        console.log(chalk.cyan(`Output: ${displayEnhanced}`));
      } else {
        console.log(chalk.gray(`Output: ${displayEnhanced}`));
      }
    } else {
      console.log(chalk.gray(`Output: [unchanged]`));
    }
    
    // Show what was detected
    const features = [];
    if (hasConsciousness) features.push(chalk.cyan('consciousness'));
    if (hasWisdom) features.push(chalk.magenta('wisdom'));
    if (hasCultural) features.push(chalk.yellow('cultural'));
    
    if (features.length > 0) {
      console.log(chalk.gray(`Features: ${features.join(', ')}`));
    }
    
    console.log('');
  }
  
  // Summary statistics
  const total = testScenarios.length;
  const consciousnessPercent = ((consciousnessCount / total) * 100).toFixed(0);
  const wisdomPercent = ((wisdomCount / total) * 100).toFixed(0);
  const culturalPercent = ((culturalCount / total) * 100).toFixed(0);
  
  console.log(chalk.bold('\n📊 Enhancement Distribution:\n'));
  
  console.log(chalk.cyan(`🟡 Consciousness: ${consciousnessCount}/${total} (${consciousnessPercent}%)`));
  console.log(chalk.cyan('   ' + '█'.repeat(Math.floor(consciousnessPercent / 5))));
  
  console.log(chalk.magenta(`\n💭 Wisdom: ${wisdomCount}/${total} (${wisdomPercent}%)`));
  console.log(chalk.magenta('   ' + '█'.repeat(Math.floor(wisdomPercent / 5))));
  
  console.log(chalk.yellow(`\n🔴 Cultural: ${culturalCount}/${total} (${culturalPercent}%)`));
  console.log(chalk.yellow('   ' + '█'.repeat(Math.floor(culturalPercent / 5))));
  
  console.log(chalk.bold('\n🟡 Balance Assessment:\n'));
  
  if (consciousnessPercent >= 70) {
    console.log(chalk.green('🏁 Consciousness is PRIMARY (>70%)'));
  } else {
    console.log(chalk.yellow('🟠️ Consciousness should be more prevalent'));
  }
  
  if (wisdomPercent >= 30 && wisdomPercent <= 60) {
    console.log(chalk.green('🏁 Wisdom appears appropriately (30-60%)'));
  } else {
    console.log(chalk.yellow(`🟠️ Wisdom at ${wisdomPercent}% (target: 30-60%)`));
  }
  
  if (culturalPercent <= 20) {
    console.log(chalk.green('🏁 Cultural vibes are subtle (<20%)'));
  } else {
    console.log(chalk.yellow('🟠️ Cultural vibes may be too frequent'));
  }
  
  console.log(chalk.gray('\n💡 The consciousness messaging and wisdom are the foundation,'));
  console.log(chalk.gray('   with cultural vibes adding occasional authentic flavor.\n'));
}

// Run the test
testBalance().catch(console.error);