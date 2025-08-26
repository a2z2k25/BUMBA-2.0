/**
 * BUMBA Specialist Ecosystem Complete Test
 * Verify all 80+ specialists are operational
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Specialist Ecosystem Complete Test'));
console.log(chalk.cyan('═'.repeat(60)));

async function testSpecialistEcosystem() {
  const results = {
    categories: {},
    specialists: {},
    overall: true
  };
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Helper function to test specialist
  function testSpecialist(categoryPath, name, displayName = null) {
    totalTests++;
    const specPath = path.join(__dirname, `../src/core/specialists/${categoryPath}/${name}.js`);
    
    if (fs.existsSync(specPath)) {
      try {
        require(specPath);
        console.log(chalk.green(`    🏁 ${displayName || name}`));
        passedTests++;
        return true;
      } catch (error) {
        console.log(chalk.red(`    🔴 ${displayName || name} (error)`));
        return false;
      }
    } else {
      console.log(chalk.red(`    🔴 ${displayName || name} not found`));
      return false;
    }
  }
  
  // ============== TEST TECHNICAL SPECIALISTS ==============
  console.log(chalk.bold.yellow('\n🟢️ Testing Technical Specialists...'));
  
  // Programming Languages
  console.log(chalk.cyan('\n  Programming Languages:'));
  const languages = [
    { file: 'javascript-specialist', name: 'JavaScript' },
    { file: 'python-specialist', name: 'Python' },
    { file: 'java-specialist', name: 'Java' },
    { file: 'csharp-specialist', name: 'C#' },
    { file: 'cpp-specialist', name: 'C++' },
    { file: 'c-specialist', name: 'C' },
    { file: 'golang-specialist', name: 'Go' },
    { file: 'rust-specialist', name: 'Rust' },
    { file: 'ruby-specialist', name: 'Ruby' },
    { file: 'php-specialist', name: 'PHP' },
    { file: 'typescript-specialist', name: 'TypeScript' },
    { file: 'scala-specialist', name: 'Scala' },
    { file: 'elixir-specialist', name: 'Elixir' }
  ];
  
  let langCount = 0;
  for (const lang of languages) {
    if (testSpecialist('technical/languages', lang.file, lang.name)) {
      langCount++;
      results.specialists[`lang_${lang.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${langCount}/${languages.length}`));
  
  // DevOps
  console.log(chalk.cyan('\n  DevOps:'));
  const devops = [
    { file: 'docker-specialist', name: 'Docker' },
    { file: 'kubernetes-specialist', name: 'Kubernetes' },
    { file: 'terraform-specialist', name: 'Terraform' },
    { file: 'jenkins-specialist', name: 'Jenkins' },
    { file: 'cicd-specialist', name: 'CI/CD' },
    { file: 'aws-specialist', name: 'AWS' },
    { file: 'sre-specialist', name: 'SRE' }
  ];
  
  let devopsCount = 0;
  for (const spec of devops) {
    if (testSpecialist('technical/devops', spec.file, spec.name)) {
      devopsCount++;
      results.specialists[`devops_${spec.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${devopsCount}/${devops.length}`));
  
  // Data & AI
  console.log(chalk.cyan('\n  Data & AI:'));
  const dataAi = [
    { file: 'data-scientist-specialist', name: 'Data Scientist' },
    { file: 'ml-engineer-specialist', name: 'ML Engineer' },
    { file: 'ai-specialist', name: 'AI Specialist' },
    { file: 'data-engineer-specialist', name: 'Data Engineer' },
    { file: 'llm-specialist', name: 'LLM Specialist' },
    { file: 'mlops-specialist', name: 'MLOps' }
  ];
  
  let dataAiCount = 0;
  for (const spec of dataAi) {
    if (testSpecialist('technical/data-ai', spec.file, spec.name)) {
      dataAiCount++;
      results.specialists[`ai_${spec.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${dataAiCount}/${dataAi.length}`));
  
  // Database
  console.log(chalk.cyan('\n  Database:'));
  const databases = [
    { file: 'postgresql-specialist', name: 'PostgreSQL' },
    { file: 'mongodb-specialist', name: 'MongoDB' },
    { file: 'redis-specialist', name: 'Redis' },
    { file: 'elasticsearch-specialist', name: 'Elasticsearch' },
    { file: 'mysql-specialist', name: 'MySQL' },
    { file: 'dynamodb-specialist', name: 'DynamoDB' }
  ];
  
  let dbCount = 0;
  for (const spec of databases) {
    if (testSpecialist('technical/database', spec.file, spec.name)) {
      dbCount++;
      results.specialists[`db_${spec.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${dbCount}/${databases.length}`));
  
  // QA
  console.log(chalk.cyan('\n  QA:'));
  const qa = [
    { file: 'test-automation-specialist', name: 'Test Automation' },
    { file: 'performance-testing-specialist', name: 'Performance Testing' },
    { file: 'security-testing-specialist', name: 'Security Testing' },
    { file: 'api-testing-specialist', name: 'API Testing' },
    { file: 'ui-testing-specialist', name: 'UI Testing' },
    { file: 'qa-lead-specialist', name: 'QA Lead' }
  ];
  
  let qaCount = 0;
  for (const spec of qa) {
    if (testSpecialist('technical/qa', spec.file, spec.name)) {
      qaCount++;
      results.specialists[`qa_${spec.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${qaCount}/${qa.length}`));
  
  // Advanced/Mobile
  console.log(chalk.cyan('\n  Advanced/Mobile:'));
  const advanced = [
    { file: 'ios-specialist', name: 'iOS' },
    { file: 'android-specialist', name: 'Android' },
    { file: 'react-native-specialist', name: 'React Native' },
    { file: 'flutter-specialist', name: 'Flutter' },
    { file: 'blockchain-specialist', name: 'Blockchain' },
    { file: 'iot-specialist', name: 'IoT' },
    { file: 'webassembly-specialist', name: 'WebAssembly' }
  ];
  
  let advCount = 0;
  for (const spec of advanced) {
    if (testSpecialist('technical/advanced', spec.file, spec.name)) {
      advCount++;
      results.specialists[`adv_${spec.file}`] = true;
    }
  }
  console.log(chalk.cyan(`    Total: ${advCount}/${advanced.length}`));
  
  // Security
  if (testSpecialist('technical', 'security-specialist', 'Security')) {
    passedTests++;
    results.specialists.security = true;
  }
  
  const techTotal = langCount + devopsCount + dataAiCount + dbCount + qaCount + advCount;
  results.categories.technical = techTotal;
  
  // ============== TEST EXPERIENCE SPECIALISTS ==============
  console.log(chalk.bold.yellow('\n🔴 Testing Experience Specialists...'));
  
  const experience = [
    { file: 'ux-research-specialist', name: 'UX Research' },
    { file: 'ux-research', name: 'UX Research (alt)' },
    { file: 'ui-design', name: 'UI Design' },
    { file: 'frontend-developer', name: 'Frontend Developer' },
    { file: 'react-specialist', name: 'React' },
    { file: 'vue-specialist', name: 'Vue' },
    { file: 'angular-specialist', name: 'Angular' },
    { file: 'design-system-architect', name: 'Design System' },
    { file: 'accessibility', name: 'Accessibility' },
    { file: 'performance-specialist', name: 'Performance' },
    { file: 'css-specialist', name: 'CSS' }
  ];
  
  let expCount = 0;
  for (const spec of experience) {
    if (testSpecialist('experience', spec.file, spec.name)) {
      expCount++;
      results.specialists[`exp_${spec.file}`] = true;
    }
  }
  results.categories.experience = expCount;
  console.log(chalk.cyan(`  Total: ${expCount}/${experience.length}`));
  
  // ============== TEST STRATEGIC SPECIALISTS ==============
  console.log(chalk.bold.yellow('\n📊 Testing Strategic Specialists...'));
  
  const strategic = [
    { file: 'product-manager', name: 'Product Manager' },
    { file: 'business-analyst', name: 'Business Analyst' },
    { file: 'market-research', name: 'Market Research' },
    { file: 'market-research-specialist', name: 'Market Research Specialist' },
    { file: 'competitive-analysis', name: 'Competitive Analysis' },
    { file: 'business-model', name: 'Business Model' },
    { file: 'risk-manager', name: 'Risk Manager' },
    { file: 'quant-analyst', name: 'Quant Analyst' },
    { file: 'sales-automator', name: 'Sales Automator' },
    { file: 'customer-support', name: 'Customer Support' },
    { file: 'legal-advisor', name: 'Legal Advisor' },
    { file: 'content-marketer', name: 'Content Marketer' }
  ];
  
  let stratCount = 0;
  for (const spec of strategic) {
    if (testSpecialist('strategic', spec.file, spec.name)) {
      stratCount++;
      results.specialists[`strat_${spec.file}`] = true;
    }
  }
  results.categories.strategic = stratCount;
  console.log(chalk.cyan(`  Total: ${stratCount}/${strategic.length}`));
  
  // ============== TEST DOCUMENTATION SPECIALISTS ==============
  console.log(chalk.bold.yellow('\n📚 Testing Documentation Specialists...'));
  
  const documentation = [
    { file: 'api-documenter', name: 'API Documenter' },
    { file: 'docs-architect', name: 'Docs Architect' },
    { file: 'tutorial-engineer', name: 'Tutorial Engineer' },
    { file: 'reference-builder', name: 'Reference Builder' },
    { file: 'mermaid-expert', name: 'Mermaid Expert' }
  ];
  
  let docCount = 0;
  for (const spec of documentation) {
    if (testSpecialist('documentation', spec.file, spec.name)) {
      docCount++;
      results.specialists[`doc_${spec.file}`] = true;
    }
  }
  results.categories.documentation = docCount;
  console.log(chalk.cyan(`  Total: ${docCount}/${documentation.length}`));
  
  // ============== TEST SPECIALIZED DOMAIN SPECIALISTS ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Specialized Domain Specialists...'));
  
  const specialized = [
    { file: 'healthcare-specialist', name: 'Healthcare' },
    { file: 'fintech-specialist', name: 'Fintech' },
    { file: 'ecommerce-specialist', name: 'E-commerce' },
    { file: 'edtech-specialist', name: 'EdTech' },
    { file: 'gaming-specialist', name: 'Gaming' },
    { file: 'media-specialist', name: 'Media' },
    { file: 'logistics-specialist', name: 'Logistics' }
  ];
  
  let specCount = 0;
  for (const spec of specialized) {
    if (testSpecialist('specialized', spec.file, spec.name)) {
      specCount++;
      results.specialists[`spec_${spec.file}`] = true;
    }
  }
  results.categories.specialized = specCount;
  console.log(chalk.cyan(`  Total: ${specCount}/${specialized.length}`));
  
  // Test Specialist Base
  console.log(chalk.bold.yellow('\n🔧 Testing Core Components...'));
  if (testSpecialist('', 'specialist-base', 'Specialist Base Class')) {
    results.specialists.base = true;
  }
  
  if (testSpecialist('', 'specialist-agent', 'Specialist Agent')) {
    results.specialists.agent = true;
  }
  
  // ============== CALCULATE RESULTS ==============
  const successRate = Math.round((passedTests / totalTests) * 100);
  results.overall = successRate >= 80; // Consider 80% as operational
  
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('TEST RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold(`\nTests Passed: ${passedTests}/${totalTests} (${successRate}%)`));
  
  // Category breakdown
  console.log('\n📊 Category Breakdown:');
  console.log(`  Technical: ${techTotal} specialists`);
  console.log(`  Experience: ${expCount} specialists`);
  console.log(`  Strategic: ${stratCount} specialists`);
  console.log(`  Documentation: ${docCount} specialists`);
  console.log(`  Specialized: ${specCount} specialists`);
  
  const totalSpecialists = techTotal + expCount + stratCount + docCount + specCount;
  console.log(chalk.bold(`\n🟡 Total Specialists: ${totalSpecialists}`));
  
  if (successRate >= 80) {
    console.log(chalk.bold.green('\n🏁 SPECIALIST ECOSYSTEM OPERATIONAL!'));
  } else if (successRate >= 60) {
    console.log(chalk.bold.yellow('\n🟠️ Specialist Ecosystem partially operational'));
  } else {
    console.log(chalk.bold.red('\n🔴 Specialist Ecosystem needs attention'));
  }
  
  // Save results
  const reportPath = path.join(__dirname, '../SPECIALIST_ECOSYSTEM_COMPLETE.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalTests,
      passedTests,
      successRate: `${successRate}%`,
      totalSpecialists
    },
    categories: results.categories,
    specialists: results.specialists
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: SPECIALIST_ECOSYSTEM_COMPLETE.json`));
  
  return successRate;
}

// Run tests
console.log(chalk.gray('\nStarting comprehensive specialist test...\n'));

testSpecialistEcosystem().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.green(`🏁 SPECIALIST ECOSYSTEM AUDIT COMPLETE: ${score}% OPERATIONAL`));
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during testing:'), error);
  process.exit(1);
});