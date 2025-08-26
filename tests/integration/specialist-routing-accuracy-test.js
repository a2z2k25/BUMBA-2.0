/**
 * BUMBA Specialist Routing Accuracy Test
 * Comprehensive test to ensure tasks are correctly allocated to the right specialists
 */

// Mock logger
const mockLogger = {
  info: () => {},
  error: console.error,
  warn: console.warn,
  debug: () => {}
};

// Override require for logger
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.includes('bumba-logger')) {
    return { logger: mockLogger };
  }
  return originalRequire.apply(this, arguments);
};

const { BumbaIntelligentRouter } = require('../core/intelligent-router');
const BackendEngineerManager = require('../core/departments/backend-engineer-manager');
const ProductStrategistManager = require('../core/departments/product-strategist-manager');
const DesignEngineerManager = require('../core/departments/design-engineer-manager');

// Test scenarios with expected routing
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

  // Ambiguous tasks (could go to multiple departments)
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
  {
    id: 'ambiguous-4',
    task: 'Review the code',
    expectedDepartment: 'technical',
    expectedSpecialists: ['code-reviewer'],
    category: 'Ambiguous'
  },

  // Edge cases (tricky routing)
  {
    id: 'edge-1',
    task: 'Make the app faster', // Very vague
    expectedDepartments: ['technical', 'experience'],
    possibleSpecialists: ['performance-optimization', 'database', 'javascript-specialist'],
    category: 'Edge Case'
  },
  {
    id: 'edge-2',
    task: 'Fix the thing that\'s broken', // No context
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
  {
    id: 'edge-4',
    task: 'Create a design system', // Could be technical or design
    expectedDepartments: ['experience', 'technical'],
    possibleSpecialists: ['ui-design', 'shadcn-specialist', 'javascript-specialist'],
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

  // Specialist name collision tests
  {
    id: 'collision-1',
    task: 'Review security vulnerabilities in the codebase',
    expectedDepartment: 'technical',
    expectedSpecialists: ['security-architect', 'code-reviewer'],
    category: 'Name Collision'
  },
  {
    id: 'collision-2',
    task: 'Develop mobile game with Unity',
    expectedDepartment: 'technical',
    expectedSpecialists: ['game-developer', 'mobile-developer'],
    category: 'Name Collision'
  }
];

// Test harness
async function runRoutingTest() {
  console.log('🟢 BUMBA SPECIALIST ROUTING ACCURACY TEST');
  console.log('=========================================\n');

  const router = new BumbaIntelligentRouter();
  const departments = {
    technical: new BackendEngineerManager(),
    strategic: new ProductStrategistManager(),
    experience: new DesignEngineerManager()
  };

  const results = {
    totalTests: testScenarios.length,
    passed: 0,
    failed: 0,
    partiallyCorrect: 0,
    accuracyByCategory: {},
    failurePatterns: [],
    routingTimes: []
  };

  console.log(`Running ${testScenarios.length} test scenarios...\n`);

  // Test each scenario
  for (const scenario of testScenarios) {
    const startTime = Date.now();
    
    console.log(`\n🟢 Test ${scenario.id}: ${scenario.category}`);
    console.log(`   Task: "${scenario.task}"`);
    
    // Get routing decision
    const routingAnalysis = await router.analyzeTask(scenario.task, [], {});
    const routingTime = Date.now() - startTime;
    results.routingTimes.push(routingTime);
    
    console.log(`   Routed to: ${routingAnalysis.departments.join(', ')}`);
    
    // Get specialist recommendations from each department
    const allSpecialists = [];
    for (const dept of routingAnalysis.departments) {
      const manager = departments[dept];
      if (manager) {
        const specialists = await manager.analyzeSpecialistNeeds({ description: scenario.task });
        allSpecialists.push(...specialists);
        console.log(`   ${dept} specialists: ${specialists.join(', ') || 'none'}`);
      }
    }
    
    // Evaluate results
    const evaluation = evaluateRouting(scenario, routingAnalysis, allSpecialists);
    console.log(`   Result: ${evaluation.status} ${evaluation.details}`);
    
    // Track results
    if (evaluation.status === '🏁') {
      results.passed++;
    } else if (evaluation.status === '🟡') {
      results.partiallyCorrect++;
    } else {
      results.failed++;
      results.failurePatterns.push({
        scenario: scenario.id,
        task: scenario.task,
        expected: scenario.expectedSpecialists || scenario.possibleSpecialists,
        actual: allSpecialists,
        issue: evaluation.issue
      });
    }
    
    // Track by category
    if (!results.accuracyByCategory[scenario.category]) {
      results.accuracyByCategory[scenario.category] = { total: 0, correct: 0 };
    }
    results.accuracyByCategory[scenario.category].total++;
    if (evaluation.status === '🏁') {
      results.accuracyByCategory[scenario.category].correct++;
    }
  }

  // Generate report
  console.log('\n\n🟢 ROUTING ACCURACY REPORT');
  console.log('===========================\n');
  
  const overallAccuracy = ((results.passed / results.totalTests) * 100).toFixed(1);
  const partialAccuracy = ((results.partiallyCorrect / results.totalTests) * 100).toFixed(1);
  const failureRate = ((results.failed / results.totalTests) * 100).toFixed(1);
  
  console.log('Overall Results:');
  console.log('---------------');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`🏁 Fully Correct: ${results.passed} (${overallAccuracy}%)`);
  console.log(`🟡  Partially Correct: ${results.partiallyCorrect} (${partialAccuracy}%)`);
  console.log(`🔴 Failed: ${results.failed} (${failureRate}%)`);
  
  console.log('\nAccuracy by Category:');
  console.log('--------------------');
  for (const [category, stats] of Object.entries(results.accuracyByCategory)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%)`);
  }
  
  console.log('\nRouting Performance:');
  console.log('-------------------');
  const avgRoutingTime = results.routingTimes.reduce((a, b) => a + b, 0) / results.routingTimes.length;
  console.log(`Average Routing Time: ${avgRoutingTime.toFixed(2)}ms`);
  console.log(`Max Routing Time: ${Math.max(...results.routingTimes)}ms`);
  console.log(`Min Routing Time: ${Math.min(...results.routingTimes)}ms`);
  
  if (results.failurePatterns.length > 0) {
    console.log('\n🟡  Failure Patterns:');
    console.log('--------------------');
    for (const failure of results.failurePatterns) {
      console.log(`\n${failure.scenario}: ${failure.task}`);
      console.log(`Expected: ${failure.expected.join(', ')}`);
      console.log(`Actual: ${failure.actual.join(', ')}`);
      console.log(`Issue: ${failure.issue}`);
    }
  }
  
  // Generate recommendations
  const recommendations = generateRoutingRecommendations(results);
  console.log('\n\n🟢 ROUTING IMPROVEMENT RECOMMENDATIONS');
  console.log('======================================\n');
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`);
    console.log(`   Priority: ${rec.priority}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Implementation: ${rec.implementation}\n`);
  });
  
  return { results, recommendations };
}

// Evaluation helper
function evaluateRouting(scenario, routingAnalysis, actualSpecialists) {
  // Handle single or multiple expected departments
  const expectedDepts = scenario.expectedDepartments || [scenario.expectedDepartment];
  const departmentMatch = expectedDepts.some(dept => 
    routingAnalysis.departments.includes(dept)
  );
  
  // Handle expected specialists
  const expectedSpecs = scenario.expectedSpecialists || scenario.possibleSpecialists || [];
  const specialistMatches = expectedSpecs.filter(spec => 
    actualSpecialists.includes(spec)
  ).length;
  
  // Evaluation logic
  if (departmentMatch && specialistMatches === expectedSpecs.length) {
    return { status: '🏁', details: 'Perfect match' };
  } else if (departmentMatch && specialistMatches > 0) {
    return { 
      status: '🟡', 
      details: `Partial match (${specialistMatches}/${expectedSpecs.length} specialists)`,
      issue: 'Missing some expected specialists'
    };
  } else if (!departmentMatch) {
    return { 
      status: '🔴', 
      details: 'Wrong department',
      issue: 'Routed to incorrect department'
    };
  } else {
    return { 
      status: '🔴', 
      details: 'No specialist match',
      issue: 'Failed to identify correct specialists'
    };
  }
}

// Generate recommendations based on test results
function generateRoutingRecommendations(results) {
  const recommendations = [];
  
  // Analyze failure patterns
  const failureRate = (results.failed / results.totalTests) * 100;
  const ambiguousAccuracy = results.accuracyByCategory['Ambiguous'] ? 
    (results.accuracyByCategory['Ambiguous'].correct / results.accuracyByCategory['Ambiguous'].total) * 100 : 100;
  
  // Priority 1: Critical routing improvements
  if (failureRate > 10) {
    recommendations.push({
      title: 'Implement Contextual Routing Enhancement',
      priority: 'CRITICAL',
      description: 'Current routing fails on ambiguous tasks. Implement context-aware routing that considers task history and project context.',
      implementation: 'Add a ContextualRouter class that maintains conversation history and uses it to disambiguate routing decisions.'
    });
  }
  
  // Priority 2: Specialist identification improvements
  if (results.failurePatterns.some(f => f.issue === 'Failed to identify correct specialists')) {
    recommendations.push({
      title: 'Enhance Specialist Keyword Matching',
      priority: 'HIGH',
      description: 'Some specialists are not being identified due to limited keyword matching.',
      implementation: 'Implement semantic matching using embeddings or expand keyword dictionaries with synonyms and related terms.'
    });
  }
  
  // Priority 3: Multi-department coordination
  recommendations.push({
    title: 'Implement Multi-Department Task Coordinator',
    priority: 'HIGH',
    description: 'Complex tasks requiring multiple departments need better coordination.',
    implementation: 'Create a TaskCoordinator class that can split tasks across departments and manage inter-department communication.'
  });
  
  // Priority 4: Ambiguity resolution
  if (ambiguousAccuracy < 80) {
    recommendations.push({
      title: 'Add Ambiguity Resolution System',
      priority: 'HIGH',
      description: 'Ambiguous tasks have lower routing accuracy. Implement a system to clarify requirements.',
      implementation: 'Add a clarification prompt system that asks for more details when confidence is low.'
    });
  }
  
  // Priority 5: Performance optimization
  const avgRoutingTime = results.routingTimes.reduce((a, b) => a + b, 0) / results.routingTimes.length;
  if (avgRoutingTime > 50) {
    recommendations.push({
      title: 'Optimize Routing Performance',
      priority: 'MEDIUM',
      description: 'Routing decisions are taking too long for real-time interactions.',
      implementation: 'Implement caching for common task patterns and pre-compile routing rules.'
    });
  }
  
  // Priority 6: Specialist overlap handling
  recommendations.push({
    title: 'Handle Specialist Overlap Better',
    priority: 'MEDIUM',
    description: 'Some specialists (mobile, game developer) work across departments causing routing confusion.',
    implementation: 'Create a specialist capability matrix that maps specialists to multiple departments with primary/secondary designations.'
  });
  
  // Priority 7: Confidence scoring
  recommendations.push({
    title: 'Implement Routing Confidence Scoring',
    priority: 'MEDIUM',
    description: 'Add confidence scores to routing decisions to identify when manual override might be needed.',
    implementation: 'Return confidence scores with routing decisions and flag low-confidence routes for review.'
  });
  
  // Priority 8: Learning system
  recommendations.push({
    title: 'Add Routing Feedback Loop',
    priority: 'LOW',
    description: 'System should learn from routing corrections to improve over time.',
    implementation: 'Implement a feedback mechanism that tracks routing success and adjusts patterns accordingly.'
  });
  
  return recommendations;
}

// Execute the test
runRoutingTest().then(({ results, recommendations }) => {
  console.log('\n🏁 Routing test completed!');
  
  // Save detailed report
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    recommendations,
    testScenarios
  };
  
  fs.writeFileSync(
    'routing-test-results.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\nDetailed results saved to routing-test-results.json');
}).catch(error => {
  console.error('🔴 Test failed:', error);
  process.exit(1);
});