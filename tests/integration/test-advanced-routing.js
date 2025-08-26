/**
 * Test the Advanced Routing System
 * Target: >90% accuracy
 */

const { AdvancedRoutingSystem } = require('../core/advanced-routing-system');

// Comprehensive test scenarios
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
    expectedDepartments: ['strategic'],
    possibleSpecialists: ['technical-writer'],
    category: 'Ambiguous'
  },
  {
    id: 'ambiguous-3',
    task: 'Build a dashboard',
    expectedDepartments: ['technical', 'experience'],
    possibleSpecialists: ['ui-design', 'javascript-specialist', 'data-engineer'],
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
  },

  // Additional edge cases for >90% coverage
  {
    id: 'edge-4',
    task: 'Create a design system',
    expectedDepartments: ['experience'],
    expectedSpecialists: ['ui-design', 'shadcn-specialist'],
    category: 'Edge Case'
  },
  {
    id: 'edge-5',
    task: 'Review and optimize our codebase',
    expectedDepartment: 'technical',
    expectedSpecialists: ['code-reviewer', 'performance-optimization'],
    category: 'Edge Case'
  },
  {
    id: 'edge-6',
    task: 'Set up monitoring and alerting',
    expectedDepartment: 'technical',
    expectedSpecialists: ['sre-specialist', 'devops-engineer'],
    category: 'Edge Case'
  },
  {
    id: 'edge-7',
    task: 'Build a REST API with database integration',
    expectedDepartment: 'technical',
    expectedSpecialists: ['api-architecture', 'database', 'javascript-specialist'],
    category: 'Edge Case'
  },
  {
    id: 'edge-8',
    task: 'Create user personas and journey maps',
    expectedDepartment: 'experience',
    expectedSpecialists: ['ux-research'],
    category: 'Edge Case'
  },
  {
    id: 'edge-9',
    task: 'Develop a pricing strategy for our SaaS product',
    expectedDepartment: 'strategic',
    expectedSpecialists: ['business-model', 'market-research'],
    category: 'Edge Case'
  },
  {
    id: 'edge-10',
    task: 'Implement real-time data streaming pipeline',
    expectedDepartment: 'technical',
    expectedSpecialists: ['data-engineer', 'python-specialist'],
    category: 'Edge Case'
  }
];

async function testAdvancedRouting() {
  console.log('🟢 TESTING ADVANCED ROUTING SYSTEM');
  console.log('==================================');
  console.log('Target: >90% accuracy\n');

  const router = new AdvancedRoutingSystem();
  
  const results = {
    totalTests: testScenarios.length,
    passed: 0,
    failed: 0,
    partiallyCorrect: 0,
    accuracyByCategory: {},
    confidenceScores: [],
    lowConfidenceCount: 0,
    clarificationCount: 0
  };

  for (const scenario of testScenarios) {
    console.log(`\n🟢 Test ${scenario.id}: ${scenario.category}`);
    console.log(`   Task: "${scenario.task}"`);
    
    // Get routing decision
    const routingResult = await router.routeTask(scenario.task);
    console.log(`   Routed to: ${routingResult.departments.join(', ')}`);
    console.log(`   Specialists: ${routingResult.specialists.join(', ') || 'none'}`);
    console.log(`   Confidence: ${(routingResult.confidence * 100).toFixed(0)}%`);
    console.log(`   Intents: ${routingResult.intents.join(', ') || 'none'}`);
    
    if (routingResult.reasoning.length > 0) {
      console.log(`   Reasoning: ${routingResult.reasoning[0]}`);
    }
    
    results.confidenceScores.push(routingResult.confidence);
    if (routingResult.confidence < 0.7) results.lowConfidenceCount++;
    if (routingResult.suggestions.length > 0) results.clarificationCount++;
    
    // Evaluate results
    const expectedDepts = scenario.expectedDepartments || [scenario.expectedDepartment];
    const departmentMatch = expectedDepts.every(dept => 
      routingResult.departments.includes(dept)
    );
    
    const expectedSpecs = scenario.expectedSpecialists || scenario.possibleSpecialists || [];
    const specialistMatches = expectedSpecs.filter(spec => 
      routingResult.specialists.includes(spec)
    ).length;
    
    let status;
    if (departmentMatch && specialistMatches >= expectedSpecs.length * 0.8) {
      status = '🏁 Perfect match';
      results.passed++;
    } else if (departmentMatch && specialistMatches >= expectedSpecs.length * 0.6) {
      status = `🟡  Partial match (${specialistMatches}/${expectedSpecs.length} specialists)`;
      results.partiallyCorrect++;
    } else {
      status = '🔴 Failed';
      results.failed++;
      console.log(`   Expected departments: ${expectedDepts.join(', ')}`);
      console.log(`   Expected specialists: ${expectedSpecs.join(', ')}`);
    }
    
    console.log(`   Result: ${status}`);
    
    if (routingResult.suggestions.length > 0) {
      console.log(`   🟢 Suggestions: ${routingResult.suggestions[0]}`);
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
  console.log('\n\n🟢 ADVANCED ROUTING ACCURACY REPORT');
  console.log('====================================\n');
  
  const overallAccuracy = ((results.passed / results.totalTests) * 100).toFixed(1);
  console.log(`🟢 Overall Accuracy: ${overallAccuracy}%`);
  console.log(`🏁 Fully Correct: ${results.passed}/${results.totalTests}`);
  console.log(`🟡  Partially Correct: ${results.partiallyCorrect}`);
  console.log(`🔴 Failed: ${results.failed}`);
  
  const avgConfidence = results.confidenceScores.reduce((a, b) => a + b, 0) / results.confidenceScores.length;
  console.log(`\n🟢 Average Confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  console.log(`🟢 Low Confidence Cases: ${results.lowConfidenceCount}`);
  console.log(`🟢 Clarification Needed: ${results.clarificationCount}`);
  
  console.log('\n🟢 Accuracy by Category:');
  for (const [category, stats] of Object.entries(results.accuracyByCategory)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%)`);
  }

  // Test additional capabilities
  console.log('\n\n🟢 TESTING ADVANCED CAPABILITIES');
  console.log('=================================\n');

  // Test memory system
  console.log('1️⃣  Testing Memory System:');
  await router.routeTask('Build a Python API with PostgreSQL'); // Prime memory
  const memoryResult = await router.routeTask('Build a Python API with PostgreSQL'); // Should use memory
  console.log(`   Memory recall confidence: ${(memoryResult.confidence * 100).toFixed(0)}%`);

  // Test intent analysis
  console.log('\n2️⃣  Testing Intent Analysis:');
  const intentResult = await router.routeTask('Fix, test, and deploy the authentication system');
  console.log(`   Detected intents: ${intentResult.intents.join(', ')}`);
  console.log(`   Departments: ${intentResult.departments.join(', ')}`);

  // Test conflict resolution
  console.log('\n3️⃣  Testing Conflict Resolution:');
  const conflictResult = await router.routeTask('Design and implement a responsive UI component');
  console.log(`   Specialists: ${conflictResult.specialists.join(', ')}`);
  console.log(`   Primary department: ${conflictResult.departments[0]}`);

  // Test clarification system
  console.log('\n4️⃣  Testing Clarification System:');
  const vagueResult = await router.routeTask('Help with the thing');
  console.log(`   Confidence: ${(vagueResult.confidence * 100).toFixed(0)}%`);
  console.log(`   Suggestions: ${vagueResult.suggestions.length} clarification questions`);
  if (vagueResult.suggestions.length > 0) {
    console.log(`   First suggestion: "${vagueResult.suggestions[0]}"`);
  }

  // Test validation system
  console.log('\n5️⃣  Testing Validation System:');
  const validationTest = await router.routeTask('Build a Rust and JavaScript full-stack application');
  console.log(`   Validation passed: ${validationTest.suggestions.length === 0}`);
  if (validationTest.suggestions.length > 0) {
    console.log(`   Validation feedback: "${validationTest.suggestions[0]}"`);
  }

  return { results, overallAccuracy: parseFloat(overallAccuracy) };
}

// Run test
testAdvancedRouting().then(({ results, overallAccuracy }) => {
  console.log('\n🏁 Advanced routing test completed!');
  
  // Calculate improvement
  const baselineAccuracy = 38.9;
  const enhancedAccuracy = 66.7;
  const improvement = overallAccuracy - enhancedAccuracy;
  
  console.log(`\n🟢 IMPROVEMENT METRICS`);
  console.log(`======================`);
  console.log(`Baseline Accuracy: ${baselineAccuracy}%`);
  console.log(`Enhanced Accuracy: ${enhancedAccuracy}%`);
  console.log(`Advanced Accuracy: ${overallAccuracy}%`);
  console.log(`Total Improvement: +${(overallAccuracy - baselineAccuracy).toFixed(1)}%`);
  
  if (overallAccuracy >= 90) {
    console.log('\n🏁 SUCCESS! Target of >90% accuracy achieved!');
  } else {
    console.log(`\n🟡  Target of >90% not yet achieved. Current: ${overallAccuracy}%`);
  }
}).catch(console.error);