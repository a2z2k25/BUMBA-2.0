/**
 * Simplified Specialist Routing Test
 * Tests routing logic without full framework dependencies
 */

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

// Simplified routing logic (mimics the actual system)
class SimplifiedRouter {
  analyzeTask(taskDescription) {
    const task = taskDescription.toLowerCase();
    const departments = [];
    
    // Technical indicators
    if (task.includes('code') || task.includes('api') || task.includes('database') ||
        task.includes('python') || task.includes('javascript') || task.includes('rust') ||
        task.includes('go') || task.includes('debug') || task.includes('kubernetes') ||
        task.includes('cloud') || task.includes('ml') || task.includes('machine learning') ||
        task.includes('blockchain') || task.includes('security') || task.includes('auth') ||
        task.includes('microservice') || task.includes('deploy') || task.includes('infrastructure')) {
      departments.push('technical');
    }
    
    // Experience/Design indicators
    if (task.includes('design') || task.includes('ui') || task.includes('ux') ||
        task.includes('interface') || task.includes('figma') || task.includes('shadcn') ||
        task.includes('component') || task.includes('responsive') || task.includes('accessibility') ||
        task.includes('wcag') || task.includes('a11y') || task.includes('visual') ||
        task.includes('layout') || task.includes('style')) {
      departments.push('experience');
    }
    
    // Strategic indicators
    if (task.includes('prd') || task.includes('product') || task.includes('roadmap') ||
        task.includes('strategy') || task.includes('market') || task.includes('competitor') ||
        task.includes('business') || task.includes('pricing') || task.includes('feature') ||
        task.includes('plan') || task.includes('analyze') || task.includes('research')) {
      departments.push('strategic');
    }
    
    // Default to technical if no match
    if (departments.length === 0) {
      departments.push('technical');
    }
    
    return { departments: [...new Set(departments)] };
  }
}

// Simplified specialist identification
class SimplifiedDepartmentManager {
  constructor(department) {
    this.department = department;
  }
  
  analyzeSpecialistNeeds(taskDescription) {
    const task = taskDescription.toLowerCase();
    const specialists = [];
    
    if (this.department === 'technical') {
      // Language specialists
      if (task.includes('javascript') || task.includes('node') || task.includes('react')) {
        specialists.push('javascript-specialist');
      }
      if (task.includes('python') || task.includes('django') || task.includes('flask')) {
        specialists.push('python-specialist');
      }
      if (task.includes('go') || task.includes('golang')) {
        specialists.push('golang-specialist');
      }
      if (task.includes('rust')) {
        specialists.push('rust-specialist');
      }
      
      // DevOps specialists
      if (task.includes('kubernetes') || task.includes('k8s')) {
        specialists.push('kubernetes-specialist');
      }
      if (task.includes('cloud') || task.includes('aws') || task.includes('deploy')) {
        specialists.push('cloud-architect');
      }
      if (task.includes('devops') || task.includes('ci') || task.includes('cd')) {
        specialists.push('devops-engineer');
      }
      if (task.includes('monitoring') || task.includes('reliability') || task.includes('performance')) {
        specialists.push('sre-specialist');
      }
      
      // AI/ML specialists
      if (task.includes('machine learning') || task.includes('ml')) {
        specialists.push('ml-engineer');
      }
      if (task.includes('data pipeline') || task.includes('etl')) {
        specialists.push('data-engineer');
      }
      if (task.includes('ai') || task.includes('artificial intelligence')) {
        specialists.push('ai-researcher');
      }
      
      // Other technical specialists
      if (task.includes('debug') || task.includes('bug') || task.includes('fix')) {
        specialists.push('debugger-specialist');
      }
      if (task.includes('review')) {
        specialists.push('code-reviewer');
      }
      if (task.includes('test') || task.includes('qa')) {
        specialists.push('test-automator');
      }
      if (task.includes('security') || task.includes('auth')) {
        specialists.push('security-architect');
      }
      if (task.includes('blockchain')) {
        specialists.push('blockchain-engineer');
      }
      if (task.includes('game')) {
        specialists.push('game-developer');
      }
      if (task.includes('mobile')) {
        specialists.push('mobile-developer');
      }
      if (task.includes('database') || task.includes('sql')) {
        specialists.push('database');
      }
      if (task.includes('api')) {
        specialists.push('api-architecture');
      }
    }
    
    if (this.department === 'experience') {
      if (task.includes('shadcn')) {
        specialists.push('shadcn-specialist');
      }
      if (task.includes('design') || task.includes('ui') || task.includes('interface')) {
        specialists.push('ui-design');
      }
      if (task.includes('ux') || task.includes('user') || task.includes('research')) {
        specialists.push('ux-research');
      }
      if (task.includes('accessibility') || task.includes('a11y') || task.includes('wcag')) {
        specialists.push('accessibility');
      }
      if (task.includes('performance') || task.includes('optimization')) {
        specialists.push('performance-optimization');
      }
      if (task.includes('mobile')) {
        specialists.push('mobile-developer');
      }
    }
    
    if (this.department === 'strategic') {
      if (task.includes('market') || task.includes('research')) {
        specialists.push('market-research');
      }
      if (task.includes('competitor') || task.includes('competitive')) {
        specialists.push('competitive-analysis');
      }
      if (task.includes('business') || task.includes('model') || task.includes('pricing')) {
        specialists.push('business-model');
      }
      if (task.includes('documentation') || task.includes('write')) {
        specialists.push('technical-writer');
      }
      if (task.includes('project') || task.includes('manage')) {
        specialists.push('project-manager');
      }
      if (task.includes('product') || task.includes('prd') || task.includes('owner')) {
        specialists.push('product-owner');
      }
    }
    
    return [...new Set(specialists)];
  }
}

// Run the test
async function runSimplifiedRoutingTest() {
  console.log('🟢 BUMBA SPECIALIST ROUTING TEST (SIMPLIFIED)');
  console.log('=============================================\n');
  
  const router = new SimplifiedRouter();
  const departments = {
    technical: new SimplifiedDepartmentManager('technical'),
    strategic: new SimplifiedDepartmentManager('strategic'),
    experience: new SimplifiedDepartmentManager('experience')
  };
  
  const results = {
    totalTests: testScenarios.length,
    passed: 0,
    failed: 0,
    partiallyCorrect: 0,
    accuracyByCategory: {},
    failurePatterns: []
  };
  
  // Test each scenario
  for (const scenario of testScenarios) {
    console.log(`\n🟢 Test ${scenario.id}: ${scenario.category}`);
    console.log(`   Task: "${scenario.task}"`);
    
    // Get routing decision
    const routingAnalysis = router.analyzeTask(scenario.task);
    console.log(`   Routed to: ${routingAnalysis.departments.join(', ')}`);
    
    // Get specialist recommendations
    const allSpecialists = [];
    for (const dept of routingAnalysis.departments) {
      const manager = departments[dept];
      const specialists = manager.analyzeSpecialistNeeds(scenario.task);
      allSpecialists.push(...specialists);
      console.log(`   ${dept} specialists: ${specialists.join(', ') || 'none'}`);
    }
    
    // Evaluate results
    const expectedDepts = scenario.expectedDepartments || [scenario.expectedDepartment];
    const departmentMatch = expectedDepts.some(dept => 
      routingAnalysis.departments.includes(dept)
    );
    
    const expectedSpecs = scenario.expectedSpecialists || scenario.possibleSpecialists || [];
    const specialistMatches = expectedSpecs.filter(spec => 
      allSpecialists.includes(spec)
    ).length;
    
    let status;
    if (departmentMatch && specialistMatches === expectedSpecs.length) {
      status = '🏁 Perfect match';
      results.passed++;
    } else if (departmentMatch && specialistMatches > 0) {
      status = `🟡  Partial match (${specialistMatches}/${expectedSpecs.length} specialists)`;
      results.partiallyCorrect++;
    } else {
      status = '🔴 Failed';
      results.failed++;
      results.failurePatterns.push({
        scenario: scenario.id,
        task: scenario.task,
        expected: expectedSpecs,
        actual: allSpecialists
      });
    }
    
    console.log(`   Result: ${status}`);
    
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
  console.log('\n\n🟢 ROUTING ACCURACY REPORT');
  console.log('===========================\n');
  
  const overallAccuracy = ((results.passed / results.totalTests) * 100).toFixed(1);
  console.log(`Overall Accuracy: ${overallAccuracy}%`);
  console.log(`🏁 Fully Correct: ${results.passed}/${results.totalTests}`);
  console.log(`🟡  Partially Correct: ${results.partiallyCorrect}`);
  console.log(`🔴 Failed: ${results.failed}`);
  
  console.log('\nAccuracy by Category:');
  for (const [category, stats] of Object.entries(results.accuracyByCategory)) {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.correct}/${stats.total} (${accuracy}%)`);
  }
  
  if (results.failurePatterns.length > 0) {
    console.log('\n🟡  Failure Patterns:');
    for (const failure of results.failurePatterns) {
      console.log(`\n${failure.scenario}: ${failure.task}`);
      console.log(`Expected: ${failure.expected.join(', ')}`);
      console.log(`Actual: ${failure.actual.join(', ')}`);
    }
  }
  
  // Recommendations
  console.log('\n\n🟢 ROUTING IMPROVEMENT RECOMMENDATIONS');
  console.log('======================================\n');
  
  console.log('1. IMPLEMENT SEMANTIC MATCHING');
  console.log('   Priority: CRITICAL');
  console.log('   Current keyword matching misses many valid routing cases.');
  console.log('   Solution: Use embeddings or NLP to understand task intent.\n');
  
  console.log('2. ADD CONTEXT-AWARE ROUTING');
  console.log('   Priority: HIGH');
  console.log('   Ambiguous tasks need context from conversation history.');
  console.log('   Solution: Maintain conversation context and use it for routing.\n');
  
  console.log('3. CREATE SPECIALIST CAPABILITY MATRIX');
  console.log('   Priority: HIGH');
  console.log('   Some specialists work across departments (mobile, game dev).');
  console.log('   Solution: Map specialists to multiple departments with weights.\n');
  
  console.log('4. IMPLEMENT CONFIDENCE SCORING');
  console.log('   Priority: MEDIUM');
  console.log('   System should know when routing is uncertain.');
  console.log('   Solution: Return confidence scores and ask for clarification when low.\n');
  
  console.log('5. ADD ROUTING VALIDATION LAYER');
  console.log('   Priority: MEDIUM');
  console.log('   Catch obvious routing errors before execution.');
  console.log('   Solution: Validate specialist availability and task compatibility.\n');
  
  console.log('6. BUILD ROUTING FEEDBACK SYSTEM');
  console.log('   Priority: LOW');
  console.log('   Learn from routing successes and failures.');
  console.log('   Solution: Track routing outcomes and adjust patterns.\n');
  
  return results;
}

// Execute test
runSimplifiedRoutingTest().catch(console.error);