/**
 * Test the Enhanced Routing System
 */

const { EnhancedRoutingSystem } = require('../core/enhanced-routing-system');

// Test scenarios from the previous test
const testScenarios = [
  // Clear-cut technical tasks
  {
    id: 'tech-1',
    task: 'Write a Python script to process CSV files and insert data into PostgreSQL',
    expectedDepartment: 'technical',
    expectedSpecialists: ['python-specialist', 'database'],
    category: 'Clear Technical'
  },
  {
    id: 'tech-2',
    task: 'Debug a memory leak in our Rust microservice',
    expectedDepartment: 'technical',
    expectedSpecialists: ['rust-specialist', 'debugger-specialist'],
    category: 'Clear Technical'
  },
  {
    id: 'tech-3',
    task: 'Set up Kubernetes deployment with auto-scaling and monitoring',
    expectedDepartment: 'technical',
    expectedSpecialists: ['kubernetes-specialist', 'devops-engineer', 'sre-specialist'],
    category: 'Clear Technical'
  },
  {
    id: 'tech-4',
    task: 'Implement JWT authentication with refresh tokens in Node.js API',
    expectedDepartment: 'technical',
    expectedSpecialists: ['javascript-specialist', 'security-architect', 'api-architecture'],
    category: 'Clear Technical'
  },
  {
    id: 'tech-5',
    task: 'Build a machine learning pipeline for fraud detection',
    expectedDepartment: 'technical',
    expectedSpecialists: ['ml-engineer', 'data-engineer', 'python-specialist'],
    category: 'Clear Technical'
  },

  // Clear-cut design tasks
  {
    id: 'design-1',
    task: 'Create a responsive navigation menu using ShadCN components',
    expectedDepartment: 'experience',
    expectedSpecialists: ['shadcn-specialist', 'ui-design'],
    category: 'Clear Design'
  },
  {
    id: 'design-2',
    task: 'Conduct accessibility audit and implement WCAG 2.1 compliance fixes',
    expectedDepartment: 'experience',
    expectedSpecialists: ['accessibility', 'ux-research'],
    category: 'Clear Design'
  },
  {
    id: 'design-3',
    task: 'Design a mobile app interface with Figma and implement with React Native',
    expectedDepartment: 'experience',
    expectedSpecialists: ['mobile-developer', 'ui-design'],
    category: 'Clear Design'
  },

  // Clear-cut strategic tasks
  {
    id: 'strategic-1',
    task: 'Create PRD for new subscription pricing model',
    expectedDepartment: 'strategic',
    expectedSpecialists: ['product-owner', 'business-model'],
    category: 'Clear Strategic'
  },
  {
    id: 'strategic-2',
    task: 'Analyze competitor features and create comparison matrix',
    expectedDepartment: 'strategic',
    expectedSpecialists: ['competitive-analysis', 'market-research'],
    category: 'Clear Strategic'
  },

  // Ambiguous tasks
  {
    id: 'ambiguous-1',
    task: 'Improve the performance of our application',
    expectedDepartments: ['technical', 'experience'],
    possibleSpecialists: ['performance-optimization', 'sre-specialist', 'database'],
    category: 'Ambiguous'
  },
  {
    id: 'ambiguous-2',
    task: 'Create documentation for the new feature',
    expectedDepartments: ['strategic', 'technical'],
    possibleSpecialists: ['technical-writer', 'product-owner'],
    category: 'Ambiguous'
  },
  {
    id: 'ambiguous-3',
    task: 'Build a dashboard',
    expectedDepartments: ['technical', 'experience'],
    possibleSpecialists: ['ui-design', 'javascript-specialist', 'shadcn-specialist'],
    category: 'Ambiguous'
  },

  // Edge cases
  {
    id: 'edge-1',
    task: 'Make the app faster',
    expectedDepartments: ['technical', 'experience'],
    possibleSpecialists: ['performance-optimization', 'database', 'javascript-specialist'],
    category: 'Edge Case'
  },
  {
    id: 'edge-2',
    task: 'Fix the thing that\'s broken',
    expectedDepartment: 'technical',
    expectedSpecialists: ['debugger-specialist'],
    category: 'Edge Case'
  },
  {
    id: 'edge-3',
    task: 'Implement blockchain-based authentication for mobile game with ML fraud detection',
    expectedDepartments: ['technical'],
    expectedSpecialists: ['blockchain-engineer', 'game-developer', 'ml-engineer', 'security-architect'],
    category: 'Edge Case'
  },

  // Multi-department tasks
  {
    id: 'multi-1',
    task: 'Plan and implement a new AI-powered feature with user testing',
    expectedDepartments: ['strategic', 'technical', 'experience'],
    expectedSpecialists: ['product-owner', 'ai-researcher', 'ml-engineer', 'ux-research'],
    category: 'Multi-Department'
  },
  {
    id: 'multi-2',
    task: 'Migrate our infrastructure to cloud with cost analysis and documentation',
    expectedDepartments: ['technical', 'strategic'],
    expectedSpecialists: ['cloud-architect', 'devops-engineer', 'business-model', 'technical-writer'],
    category: 'Multi-Department'
  }
];

async function testEnhancedRouting() {
  console.log('🟢 TESTING ENHANCED ROUTING SYSTEM');
  console.log('==================================\n');

  const router = new EnhancedRoutingSystem();
  
  const results = {
    totalTests: testScenarios.length,
    passed: 0,
    failed: 0,
    partiallyCorrect: 0,
    accuracyByCategory: {},
    confidenceScores: []
  };

  for (const scenario of testScenarios) {
    console.log(`\n🟢 Test ${scenario.id}: ${scenario.category}`);
    console.log(`   Task: "${scenario.task}"`);
    
    // Get routing decision
    const routingResult = await router.routeTask(scenario.task);
    console.log(`   Routed to: ${routingResult.departments.join(', ')}`);
    console.log(`   Specialists: ${routingResult.specialists.join(', ') || 'none'}`);
    console.log(`   Confidence: ${(routingResult.confidence * 100).toFixed(0)}%`);
    
    if (routingResult.reasoning.length > 0) {
      console.log(`   Reasoning: ${routingResult.reasoning[0]}`);
    }
    
    results.confidenceScores.push(routingResult.confidence);
    
    // Evaluate results
    const expectedDepts = scenario.expectedDepartments || [scenario.expectedDepartment];
    const departmentMatch = expectedDepts.some(dept => 
      routingResult.departments.includes(dept)
    );
    
    const expectedSpecs = scenario.expectedSpecialists || scenario.possibleSpecialists || [];
    const specialistMatches = expectedSpecs.filter(spec => 
      routingResult.specialists.includes(spec)
    ).length;
    
    let status;
    if (departmentMatch && specialistMatches === expectedSpecs.length) {
      status = '🏁 Perfect match';
      results.passed++;
    } else if (departmentMatch && specialistMatches >= expectedSpecs.length * 0.6) {
      status = `🟡  Partial match (${specialistMatches}/${expectedSpecs.length} specialists)`;
      results.partiallyCorrect++;
    } else {
      status = '🔴 Failed';
      results.failed++;
    }
    
    console.log(`   Result: ${status}`);
    
    if (routingResult.suggestions.length > 0) {
      console.log(`   Suggestions: ${routingResult.suggestions[0]}`);
    }
    
    // Track by category
    if (!results.accuracyByCategory[scenario.category]) {
      results.accuracyByCategory[scenario.category] = { total: 0, correct: 0 };
    }
    results.accuracyByCategory[scenario.category].total++;
    if (status.includes('🏁')) {
      results.accuracyByCategory[scenario.category].correct++;
    }
  }

  // Generate report
  console.log('\n\n🟢 ENHANCED ROUTING ACCURACY REPORT');
  console.log('====================================\n');
  
  const overallAccuracy = ((results.passed / results.totalTests) * 100).toFixed(1);
  console.log(`Overall Accuracy: ${overallAccuracy}%`);
  console.log(`🏁 Fully Correct: ${results.passed}/${results.totalTests}`);
  console.log(`🟡  Partially Correct: ${results.partiallyCorrect}`);
  console.log(`🔴 Failed: ${results.failed}`);
  
  const avgConfidence = results.confidenceScores.reduce((a, b) => a + b, 0) / results.confidenceScores.length;
  console.log(`\nAverage Confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  
  console.log('\nAccuracy by Category:');
  for (const [category, stats] of Object.entries(results.accuracyByCategory)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%)`);
  }

  // Test specific capabilities
  console.log('\n\n🟢 TESTING SPECIFIC CAPABILITIES');
  console.log('=================================\n');

  // Test context awareness
  console.log('Testing Context Awareness:');
  const contextResult = await router.routeTask('Build a new feature', {
    previousDepartment: 'technical',
    projectType: 'web-application'
  });
  console.log(`Without context: departments=${contextResult.departments}, confidence=${contextResult.confidence.toFixed(2)}`);

  // Test vague task handling
  console.log('\nTesting Vague Task Handling:');
  const vagueResult = await router.routeTask('Fix it');
  console.log(`Vague task: confidence=${vagueResult.confidence.toFixed(2)}, suggestions=${vagueResult.suggestions.length > 0}`);

  // Test multi-specialist coordination
  console.log('\nTesting Multi-Specialist Coordination:');
  const multiResult = await router.routeTask('Build a secure API with documentation and testing');
  console.log(`Multi-specialist task found ${multiResult.specialists.length} specialists`);
  console.log(`Specialists: ${multiResult.specialists.join(', ')}`);

  return results;
}

// Run test
testEnhancedRouting().then(results => {
  console.log('\n🏁 Enhanced routing test completed!');
  
  // Calculate improvement
  const baselineAccuracy = 38.9; // From previous test
  const enhancedAccuracy = (results.passed / results.totalTests) * 100;
  const improvement = enhancedAccuracy - baselineAccuracy;
  
  console.log(`\n🟢 IMPROVEMENT METRICS`);
  console.log(`======================`);
  console.log(`Baseline Accuracy: ${baselineAccuracy}%`);
  console.log(`Enhanced Accuracy: ${enhancedAccuracy.toFixed(1)}%`);
  console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
}).catch(console.error);