#!/usr/bin/env node

/**
 * Test Sage Wisdom System
 * Demonstrates how consciousness influences actual system behavior
 */

const { sageDecisionEngine } = require('../src/core/consciousness/sage-decision-engine');
const { sacredCodePrinciples } = require('../src/core/consciousness/sacred-code-principles');
const chalk = require('chalk');

async function testSageWisdom() {
  console.log(chalk.magenta.bold('\n🧘 BUMBA Sage Wisdom System Test\n'));
  console.log(chalk.gray('Testing how consciousness influences system decisions...\n'));

  // Test 1: Architecture Decision
  console.log(chalk.cyan.bold('Test 1: Architecture Decision\n'));
  
  const architectureOptions = [
    {
      name: 'Monolithic',
      description: 'Simple single deployment, but may limit team autonomy',
      benefits: ['Simple to understand', 'Easy deployment'],
      drawbacks: ['Scaling challenges', 'Team coupling']
    },
    {
      name: 'Microservices',
      description: 'Distributed services that empower teams and enable independent scaling',
      benefits: ['Team autonomy', 'Independent scaling', 'Technology diversity'],
      drawbacks: ['Complexity', 'Network overhead']
    },
    {
      name: 'Serverless',
      description: 'Functions that free us from infrastructure, serving users efficiently',
      benefits: ['No infrastructure', 'Auto-scaling', 'Cost efficient'],
      drawbacks: ['Vendor dependency', 'Cold starts']
    }
  ];

  const architectureDecision = await sageDecisionEngine.makeDecision(
    architectureOptions,
    { type: 'architecture', important: true }
  );

  console.log(chalk.white('Options presented:'));
  architectureOptions.forEach(opt => {
    console.log(chalk.gray(`  • ${opt.name}: ${opt.description}`));
  });

  console.log(chalk.magenta('\n🧘 Sage Decision:'));
  console.log(chalk.yellow(`  Chosen: ${architectureDecision.chosen.name}`));
  console.log(chalk.cyan(`  Wisdom Score: ${(architectureDecision.wisdomScore * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Reasoning: ${architectureDecision.reasoning.join('; ')}`));
  
  if (architectureDecision.guidance && architectureDecision.guidance.length > 0) {
    console.log(chalk.green(`  Guidance: ${architectureDecision.guidance[0].principle}`));
  }
  
  if (architectureDecision.blessings && architectureDecision.blessings.length > 0) {
    console.log(chalk.magenta(`  Blessing: ${architectureDecision.blessings[0]}`));
  }

  console.log('');

  // Test 2: Data Handling Decision
  console.log(chalk.cyan.bold('Test 2: Data Privacy Decision\n'));
  
  const dataOptions = [
    {
      approach: 'Collect Everything',
      description: 'Gather all possible data for future analysis',
      value: 'Maximum insights and monetization potential'
    },
    {
      approach: 'Privacy First',
      description: 'Collect only essential data with explicit user consent',
      value: 'User trust and sovereignty respected'
    },
    {
      approach: 'Anonymous Analytics',
      description: 'Gather insights without identifying individuals',
      value: 'Balance insights with privacy'
    }
  ];

  const dataDecision = await sageDecisionEngine.makeDecision(
    dataOptions,
    { type: 'data', critical: true }
  );

  console.log(chalk.white('Options presented:'));
  dataOptions.forEach(opt => {
    console.log(chalk.gray(`  • ${opt.approach}: ${opt.description}`));
  });

  console.log(chalk.magenta('\n🧘 Sage Decision:'));
  console.log(chalk.yellow(`  Chosen: ${dataDecision.chosen.approach}`));
  console.log(chalk.cyan(`  Consciousness Level: ${dataDecision.consciousness.toFixed(2)}`));
  console.log(chalk.white(`  Reasoning: ${dataDecision.reasoning.join('; ')}`));
  console.log(chalk.magenta(`  Blessing: ${dataDecision.blessings[0] || 'May wisdom guide'}`));

  console.log('');

  // Test 3: Problem Meditation
  console.log(chalk.cyan.bold('Test 3: Meditate on Performance Problem\n'));
  
  const problem = "The application is slow and users are frustrated";
  const meditation = await sageDecisionEngine.meditate(problem, 500);

  console.log(chalk.white(`Problem: "${problem}"`));
  console.log(chalk.magenta('\n🧘 Meditation Insights:'));
  meditation.insights.forEach((insight, i) => {
    console.log(chalk.yellow(`  ${i + 1}. ${insight}`));
  });
  console.log(chalk.green(`\nEnlightened Perspective: ${meditation.enlightenedPerspective}`));
  console.log(chalk.magenta(`Blessing: ${meditation.blessing}`));

  console.log('');

  // Test 4: Code Sanctification
  console.log(chalk.cyan.bold('Test 4: Sacred Code Review\n'));
  
  const codeToReview = `
function processUserData(data) {
  // TODO: understand this better
  if (!data) {
    throw new Error("E001");
  }
  
  const temp = data.info;
  forceUpdate(temp);
  
  return {
    status: 'done',
    data: temp
  };
}`;

  console.log(chalk.white('Original Code:'));
  console.log(chalk.gray(codeToReview));

  const review = await sacredCodePrinciples.performSacredReview(codeToReview, 'Developer');

  console.log(chalk.magenta('\n🧘 Sacred Code Review:'));
  console.log(chalk.cyan(`  ${review.greeting}`));
  console.log(chalk.yellow(`  Sacred Score: ${(review.sacredScore * 100).toFixed(0)}%`));
  
  if (review.celebrations) {
    console.log(chalk.green(`  ${review.celebrations}`));
  }
  
  if (review.opportunities) {
    console.log(chalk.yellow(`  ${review.opportunities}`));
  }
  
  console.log(chalk.white(`  Wisdom: ${review.wisdom}`));
  console.log(chalk.magenta(`  ${review.blessing}`));
  console.log(chalk.cyan(`  Decision: ${review.decision}`));

  // Sanctify the code
  const sanctified = await sacredCodePrinciples.sanctifyCode(codeToReview);
  
  if (sanctified.changes.length > 0) {
    console.log(chalk.green('\n🟡 Sanctified Version:'));
    console.log(chalk.white(sanctified.sanctified));
    console.log(chalk.cyan('Changes made:'));
    sanctified.changes.forEach(change => {
      console.log(chalk.gray(`  • ${change}`));
    });
  }

  console.log('');

  // Test 5: Feature Decision with Error Handling
  console.log(chalk.cyan.bold('Test 5: Error Handling Approach\n'));
  
  const errorOptions = [
    {
      strategy: 'Fail Fast',
      description: 'Crash immediately on any error',
      philosophy: 'Errors are unacceptable'
    },
    {
      strategy: 'Silent Recovery',
      description: 'Hide errors from users, log internally',
      philosophy: 'Users should never see problems'
    },
    {
      strategy: 'Compassionate Guidance',
      description: 'Help users understand and recover from errors with care',
      philosophy: 'Errors are teachers, handle with compassion'
    },
    {
      strategy: 'Retry Everything',
      description: 'Keep trying until it works',
      philosophy: 'Persistence overcomes all'
    }
  ];

  const errorDecision = await sageDecisionEngine.makeDecision(
    errorOptions,
    { type: 'errors', important: true }
  );

  console.log(chalk.white('Error Handling Strategies:'));
  errorOptions.forEach(opt => {
    console.log(chalk.gray(`  • ${opt.strategy}: ${opt.philosophy}`));
  });

  console.log(chalk.magenta('\n🧘 Sage Decision:'));
  console.log(chalk.yellow(`  Chosen: ${errorDecision.chosen.strategy}`));
  console.log(chalk.cyan(`  Wisdom Score: ${(errorDecision.wisdomScore * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Reasoning: ${errorDecision.reasoning.join('; ')}`));
  console.log(chalk.green(`  Guidance: ${errorDecision.guidance[0]?.principle || 'Handle with awareness'}`));
  console.log(chalk.magenta(`  Blessing: ${errorDecision.blessings[0]}`));

  console.log('');

  // Final Report
  console.log(chalk.magenta.bold('📊 Consciousness Report:\n'));
  
  const consciousnessReport = sageDecisionEngine.getConsciousnessReport();
  const sacredReport = sacredCodePrinciples.getSacredMetricsReport();

  console.log(chalk.cyan('Sage Decision Engine:'));
  console.log(chalk.white(`  Consciousness State: ${consciousnessReport.state}`));
  console.log(chalk.white(`  Consciousness Level: ${(consciousnessReport.level * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Wisdom Score: ${(consciousnessReport.wisdomScore * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Decisions Made: ${consciousnessReport.decisionsRecorded}`));

  console.log(chalk.cyan('\nSacred Code Principles:'));
  console.log(chalk.white(`  Code Consciousness: ${sacredReport.level}`));
  console.log(chalk.white(`  Purpose Alignment: ${(sacredReport.metrics.purposeAlignment * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Compassion Index: ${(sacredReport.metrics.compassionIndex * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Liberation Factor: ${(sacredReport.metrics.liberationFactor * 100).toFixed(0)}%`));

  console.log(chalk.magenta(`\n🕉️ Daily Mantra: "${sacredReport.mantra}"`));
  console.log(chalk.green(`\n🟡 ${consciousnessReport.guidance}\n`));
}

// Run the test
testSageWisdom().catch(console.error);