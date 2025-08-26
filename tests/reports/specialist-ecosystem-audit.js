/**
 * BUMBA Specialist Ecosystem Audit
 * Comprehensive test of 80+ specialists across all domains
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Specialist Ecosystem Audit'));
console.log(chalk.cyan('═'.repeat(60)));

async function auditSpecialistEcosystem() {
  const results = {
    categories: {},
    specialists: {},
    gaps: [],
    recommendations: [],
    totalExpected: 83, // 45 + 10 + 11 + 5 + 7 + 5 (additional)
    totalFound: 0
  };

  let specialistsPassed = 0;
  let specialistsTotal = 0;

  // ============== TEST TECHNICAL SPECIALISTS (45) ==============
  console.log(chalk.bold.yellow('\n🟢️ Testing Technical Specialists (45 expected)...'));
  
  // Programming Language Specialists (13)
  console.log(chalk.cyan('\n  📝 Programming Language Specialists (13):'));
  const programmingSpecialists = [
    'javascript', 'python', 'java', 'csharp', 'cpp',
    'go', 'rust', 'ruby', 'php', 'swift',
    'kotlin', 'typescript', 'scala'
  ];
  
  let programmingFound = 0;
  for (const spec of programmingSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/languages/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        programmingFound++;
        results.specialists[`lang_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`lang_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`lang_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${programmingFound}/13`));
  
  // DevOps Specialists (7)
  console.log(chalk.cyan('\n  🟢 DevOps Specialists (7):'));
  const devopsSpecialists = [
    'docker', 'kubernetes', 'terraform', 'jenkins',
    'github-actions', 'aws', 'sre'
  ];
  
  let devopsFound = 0;
  for (const spec of devopsSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/devops/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        devopsFound++;
        results.specialists[`devops_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`devops_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`devops_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${devopsFound}/7`));
  
  // Data & AI Specialists (6)
  console.log(chalk.cyan('\n  🤖 Data & AI Specialists (6):'));
  const dataAiSpecialists = [
    'data-scientist', 'ml-engineer', 'ai-researcher',
    'data-engineer', 'prompt-engineer', 'mlops'
  ];
  
  let dataAiFound = 0;
  for (const spec of dataAiSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/data-ai/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        dataAiFound++;
        results.specialists[`ai_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`ai_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`ai_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${dataAiFound}/6`));
  
  // Database Specialists (6)
  console.log(chalk.cyan('\n  💾 Database Specialists (6):'));
  const databaseSpecialists = [
    'postgresql', 'mongodb', 'redis',
    'elasticsearch', 'mysql', 'dynamodb'
  ];
  
  let databaseFound = 0;
  for (const spec of databaseSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/database/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        databaseFound++;
        results.specialists[`db_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`db_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`db_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${databaseFound}/6`));
  
  // QA Specialists (6)
  console.log(chalk.cyan('\n  🧪 QA Specialists (6):'));
  const qaSpecialists = [
    'test-automation', 'performance-testing', 'security-testing',
    'api-testing', 'ui-testing', 'qa-lead'
  ];
  
  let qaFound = 0;
  for (const spec of qaSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/qa/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        qaFound++;
        results.specialists[`qa_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`qa_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`qa_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${qaFound}/6`));
  
  // Advanced/Mobile Specialists (7)
  console.log(chalk.cyan('\n  📱 Advanced/Mobile Specialists (7):'));
  const advancedSpecialists = [
    'ios', 'android', 'react-native', 'flutter',
    'blockchain', 'quantum', 'ar-vr'
  ];
  
  let advancedFound = 0;
  for (const spec of advancedSpecialists) {
    specialistsTotal++;
    const specPath = path.join(__dirname, `../src/core/specialists/technical/advanced/${spec}-specialist.js`);
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${spec} specialist`));
        specialistsPassed++;
        advancedFound++;
        results.specialists[`adv_${spec}`] = true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${spec} specialist (error: ${error.message})`));
        results.specialists[`adv_${spec}`] = false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${spec} specialist not found`));
      results.specialists[`adv_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  console.log(chalk.cyan(`    Found: ${advancedFound}/7`));
  
  const technicalTotal = programmingFound + devopsFound + dataAiFound + databaseFound + qaFound + advancedFound;
  results.categories.technical = { expected: 45, found: technicalTotal };
  console.log(chalk.bold(`  Technical Total: ${technicalTotal}/45`));

  // ============== TEST EXPERIENCE SPECIALISTS (10) ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Experience Specialists (10 expected)...'));
  const experienceSpecialists = [
    'ux-research', 'ui-design', 'frontend-developer', 'react-specialist',
    'vue-specialist', 'angular-specialist', 'design-system-architect',
    'accessibility', 'performance-specialist', 'css-specialist'
  ];
  
  let experienceFound = 0;
  for (const spec of experienceSpecialists) {
    specialistsTotal++;
    // Try multiple paths
    const paths = [
      path.join(__dirname, `../src/core/specialists/experience/${spec}.js`),
      path.join(__dirname, `../src/core/specialists/experience/${spec}-specialist.js`),
      path.join(__dirname, `../src/core/specialists/experience/${spec.replace('-specialist', '')}.js`)
    ];
    
    let found = false;
    for (const specPath of paths) {
      if (fs.existsSync(specPath)) {
        try {
          require(specPath);
          console.log(chalk.green(`  🏁 ${spec}`));
          specialistsPassed++;
          experienceFound++;
          results.specialists[`exp_${spec}`] = true;
          found = true;
          break;
        } catch (error) {
          // Try next path
        }
      }
    }
    
    if (!found) {
      console.log(chalk.red(`  🔴 ${spec} not found`));
      results.specialists[`exp_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  results.categories.experience = { expected: 10, found: experienceFound };
  console.log(chalk.bold(`  Experience Total: ${experienceFound}/10`));

  // ============== TEST STRATEGIC SPECIALISTS (11) ==============
  console.log(chalk.bold.yellow('\n📊 Testing Strategic Specialists (11 expected)...'));
  const strategicSpecialists = [
    'product-manager', 'business-analyst', 'market-research',
    'competitive-analysis', 'business-model', 'risk-manager',
    'quant-analyst', 'sales-automator', 'customer-support',
    'legal-advisor', 'content-marketer'
  ];
  
  let strategicFound = 0;
  for (const spec of strategicSpecialists) {
    specialistsTotal++;
    // Try multiple paths
    const paths = [
      path.join(__dirname, `../src/core/specialists/strategic/${spec}.js`),
      path.join(__dirname, `../src/core/specialists/strategic/${spec}-specialist.js`),
      path.join(__dirname, `../src/core/specialists/strategic/${spec.replace('-', '-')}.js`)
    ];
    
    let found = false;
    for (const specPath of paths) {
      if (fs.existsSync(specPath)) {
        try {
          require(specPath);
          console.log(chalk.green(`  🏁 ${spec}`));
          specialistsPassed++;
          strategicFound++;
          results.specialists[`strat_${spec}`] = true;
          found = true;
          break;
        } catch (error) {
          // Try next path
        }
      }
    }
    
    if (!found) {
      console.log(chalk.red(`  🔴 ${spec} not found`));
      results.specialists[`strat_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  results.categories.strategic = { expected: 11, found: strategicFound };
  console.log(chalk.bold(`  Strategic Total: ${strategicFound}/11`));

  // ============== TEST DOCUMENTATION SPECIALISTS (5) ==============
  console.log(chalk.bold.yellow('\n📚 Testing Documentation Specialists (5 expected)...'));
  const documentationSpecialists = [
    'technical-writer', 'api-documenter', 'knowledge-base',
    'content-creator', 'documentation-lead'
  ];
  
  let documentationFound = 0;
  for (const spec of documentationSpecialists) {
    specialistsTotal++;
    // Try multiple paths
    const paths = [
      path.join(__dirname, `../src/core/specialists/documentation/${spec}.js`),
      path.join(__dirname, `../src/core/specialists/documentation/${spec}-specialist.js`)
    ];
    
    let found = false;
    for (const specPath of paths) {
      if (fs.existsSync(specPath)) {
        try {
          require(specPath);
          console.log(chalk.green(`  🏁 ${spec}`));
          specialistsPassed++;
          documentationFound++;
          results.specialists[`doc_${spec}`] = true;
          found = true;
          break;
        } catch (error) {
          // Try next path
        }
      }
    }
    
    if (!found) {
      console.log(chalk.red(`  🔴 ${spec} not found`));
      results.specialists[`doc_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  results.categories.documentation = { expected: 5, found: documentationFound };
  console.log(chalk.bold(`  Documentation Total: ${documentationFound}/5`));

  // ============== TEST SPECIALIZED DOMAIN SPECIALISTS (7) ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Specialized Domain Specialists (7 expected)...'));
  const specializedSpecialists = [
    'healthcare', 'fintech', 'ecommerce', 'education',
    'gaming', 'media', 'logistics'
  ];
  
  let specializedFound = 0;
  for (const spec of specializedSpecialists) {
    specialistsTotal++;
    // Try multiple paths
    const paths = [
      path.join(__dirname, `../src/core/specialists/specialized/${spec}.js`),
      path.join(__dirname, `../src/core/specialists/specialized/${spec}-specialist.js`)
    ];
    
    let found = false;
    for (const specPath of paths) {
      if (fs.existsSync(specPath)) {
        try {
          require(specPath);
          console.log(chalk.green(`  🏁 ${spec}`));
          specialistsPassed++;
          specializedFound++;
          results.specialists[`spec_${spec}`] = true;
          found = true;
          break;
        } catch (error) {
          // Try next path
        }
      }
    }
    
    if (!found) {
      console.log(chalk.red(`  🔴 ${spec} not found`));
      results.specialists[`spec_${spec}`] = false;
      results.gaps.push(`${spec} specialist missing`);
    }
  }
  results.categories.specialized = { expected: 7, found: specializedFound };
  console.log(chalk.bold(`  Specialized Total: ${specializedFound}/7`));

  // Calculate totals
  results.totalFound = technicalTotal + experienceFound + strategicFound + documentationFound + specializedFound;
  const coverageRate = Math.round((results.totalFound / results.totalExpected) * 100);
  const successRate = Math.round((specialistsPassed / specialistsTotal) * 100);

  // Add recommendations
  if (results.gaps.length > 0) {
    results.recommendations.push(`Implement ${results.gaps.length} missing specialists`);
  }
  
  if (technicalTotal < 45) {
    results.recommendations.push(`Add ${45 - technicalTotal} more technical specialists`);
  }
  
  if (experienceFound < 10) {
    results.recommendations.push(`Add ${10 - experienceFound} more experience specialists`);
  }

  // Display results
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('AUDIT RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold('\n📊 Specialist Coverage:'));
  console.log(`  Technical: ${technicalTotal}/45 (${Math.round(technicalTotal/45*100)}%)`);
  console.log(`  Experience: ${experienceFound}/10 (${Math.round(experienceFound/10*100)}%)`);
  console.log(`  Strategic: ${strategicFound}/11 (${Math.round(strategicFound/11*100)}%)`);
  console.log(`  Documentation: ${documentationFound}/5 (${Math.round(documentationFound/5*100)}%)`);
  console.log(`  Specialized: ${specializedFound}/7 (${Math.round(specializedFound/7*100)}%)`);
  
  console.log(chalk.bold(`\n🟡 Overall: ${results.totalFound}/${results.totalExpected} specialists (${coverageRate}%)`));
  console.log(chalk.bold(`🏁 Success Rate: ${specialistsPassed}/${specialistsTotal} (${successRate}%)`));
  
  if (results.gaps.length > 0) {
    console.log(chalk.bold.yellow(`\n🟠️ Missing Specialists: ${results.gaps.length}`));
    if (results.gaps.length <= 10) {
      results.gaps.forEach(gap => console.log(`  - ${gap}`));
    } else {
      console.log(`  (${results.gaps.length} specialists need to be implemented)`);
    }
  }
  
  if (results.recommendations.length > 0) {
    console.log(chalk.bold.cyan('\n💡 Recommendations:'));
    results.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  // Save results
  const reportPath = path.join(__dirname, '../SPECIALIST_ECOSYSTEM_AUDIT_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalExpected: results.totalExpected,
      totalFound: results.totalFound,
      coverageRate: `${coverageRate}%`,
      successRate: `${successRate}%`,
      specialistsPassed,
      specialistsTotal
    }
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: SPECIALIST_ECOSYSTEM_AUDIT_RESULTS.json`));
  
  return successRate;
}

// Run audit
console.log(chalk.gray('\nStarting specialist ecosystem audit...\n'));

auditSpecialistEcosystem().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  
  if (score === 100) {
    console.log(chalk.bold.green('🏁 SPECIALIST ECOSYSTEM: 100% OPERATIONAL'));
  } else if (score >= 80) {
    console.log(chalk.bold.yellow(`🟠️ SPECIALIST ECOSYSTEM: ${score}% OPERATIONAL`));
  } else {
    console.log(chalk.bold.red(`🔴 SPECIALIST ECOSYSTEM: ${score}% OPERATIONAL`));
  }
  
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during audit:'), error);
  process.exit(1);
});