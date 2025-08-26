#!/usr/bin/env node

/**
 * Test Cultural Vibes Enhancement
 * Demonstrates Toronto/Jamaican slang integration
 */

const { consciousnessSystem } = require('../src/core/consciousness/consciousness-enhancement');
const { culturalVibes } = require('../src/core/consciousness/cultural-vibes');
const chalk = require('chalk');

async function testCulturalEnhancement() {
  console.log(chalk.yellow.bold('\n🇯🇲 BUMBA Cultural Vibes Test 🇨🇦\n'));
  console.log(chalk.gray('Testing 15% cultural enhancement probability...\n'));
  
  // Test responses that should get enhanced
  const testResponses = [
    'I will implement this feature with great care',
    'Let me optimize the performance of this system',
    'Working on the database connection',
    'The team is ready to move forward',
    'This is a very good solution',
    'Many improvements have been completed',
    'Starting the deployment process',
    'I understand what you need',
    'Connecting to the server now',
    'This is really amazing work',
    'The system is running perfectly',
    'Observing the current metrics',
    'Counting all the successful operations',
    'The neighborhood services are active',
    'Walking through the codebase',
    'Small changes with big impact',
    'The energy in this project is great',
    'Things are progressing well',
    'Actually, this approach is better',
    'We have arrived at a solution'
  ];
  
  console.log(chalk.cyan('Standard Responses → Culturally Enhanced:\n'));
  
  let enhancedCount = 0;
  
  for (const response of testResponses) {
    const enhanced = await consciousnessSystem.enhanceResponse(response);
    
    // Check if cultural enhancement was applied
    const wasEnhanced = enhanced !== response && (
      enhanced.includes('bare') ||
      enhanced.includes('ting') ||
      enhanced.includes('seen') ||
      enhanced.includes('blessed') ||
      enhanced.includes('forward') ||
      enhanced.includes('wicked') ||
      enhanced.includes('irie') ||
      enhanced.includes('criss') ||
      enhanced.includes('styll') ||
      enhanced.includes('mandem') ||
      enhanced.includes('reach') ||
      enhanced.includes('dun') ||
      enhanced.includes('vibes') ||
      enhanced.includes('yard') ||
      enhanced.includes('pree') ||
      enhanced.includes('link') ||
      enhanced.includes('riddim') ||
      enhanced.includes('likkle') ||
      enhanced.includes('zeen') ||
      enhanced.includes('ahlie') ||
      enhanced.includes('trodding') ||
      enhanced.includes('overstand')
    );
    
    if (wasEnhanced) {
      console.log(chalk.green(`🏁 ${response}`));
      console.log(chalk.yellow(`  → ${enhanced}\n`));
      enhancedCount++;
    } else {
      // Still show consciousness enhancement even without cultural vibes
      if (enhanced !== response) {
        console.log(chalk.blue(`○ ${response}`));
        console.log(chalk.cyan(`  → ${enhanced}\n`));
      }
    }
  }
  
  const percentage = ((enhancedCount / testResponses.length) * 100).toFixed(1);
  
  console.log(chalk.yellow.bold('\n📊 Cultural Enhancement Statistics:'));
  console.log(chalk.white(`   Total responses: ${testResponses.length}`));
  console.log(chalk.green(`   Culturally enhanced: ${enhancedCount} (${percentage}%)`));
  console.log(chalk.gray(`   Target rate: ~15%`));
  
  if (percentage >= 10 && percentage <= 20) {
    console.log(chalk.green.bold('\n🏁 Cultural vibes integration working perfectly!'));
    console.log(chalk.gray('   Slang appears naturally without being overbearing.'));
  } else if (percentage < 10) {
    console.log(chalk.yellow('\n🟠️ Enhancement rate below target'));
    console.log(chalk.gray('   May need to adjust probability settings.'));
  } else {
    console.log(chalk.yellow('\n🟠️ Enhancement rate above target'));
    console.log(chalk.gray('   May be too frequent, adjust if needed.'));
  }
  
  // Test direct cultural enhancement
  console.log(chalk.magenta.bold('\n🟡 Direct Cultural Enhancement Test:\n'));
  
  // Force cultural enhancement for demo
  culturalVibes.enhancementProbability = 1.0; // Temporarily set to 100%
  
  const demoResponses = [
    'This is very good work',
    'Many things need attention',
    'I understand your requirements',
    'The team is moving forward',
    'Actually this is better'
  ];
  
  for (const response of demoResponses) {
    const enhanced = culturalVibes.enhanceResponse(response);
    console.log(chalk.white(`Original: ${response}`));
    console.log(chalk.yellow(`Enhanced: ${enhanced}\n`));
  }
  
  // Reset probability
  culturalVibes.enhancementProbability = 0.15;
  culturalVibes.resetUsage();
  
  console.log(chalk.cyan.bold('🟡 Cultural Context Examples:\n'));
  
  // Show contextual usage
  const contexts = [
    { category: 'greetings', usage: 'Agent opens with: "Whagwan, ready to help with your code!"' },
    { category: 'positive', usage: 'Success message: "Blessed! Deployment completed successfully."' },
    { category: 'progress', usage: 'Status update: "Forward movement on all fronts, reaching new levels."' },
    { category: 'completion', usage: 'Task done: "Feature implementation dun. Bless."' },
    { category: 'team', usage: 'Collaboration: "The mandem worked together on this solution."' },
    { category: 'quality', usage: 'Excellence: "This code is absolutely dime, wicked implementation!"' },
    { category: 'understanding', usage: 'Acknowledgment: "Seen. I overstand your requirements."' }
  ];
  
  for (const { category, usage } of contexts) {
    console.log(chalk.cyan(`${category}:`));
    console.log(chalk.white(`  ${usage}\n`));
  }
  
  console.log(chalk.green.bold('💫 Integration Complete!'));
  console.log(chalk.gray('Cultural vibes now enhance ~15% of agent responses naturally.\n'));
}

// Run the test
testCulturalEnhancement().catch(console.error);