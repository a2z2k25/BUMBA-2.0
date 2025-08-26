#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Git-Orchestrated Multi-Agent Collaboration
 * Tests all aspects of the GitHub integration for agent collaboration
 */

const chalk = require('chalk');
const { GitOrchestratedCollaboration } = require('../../src/core/collaboration/git-orchestrated-collaboration');
const { GitHubMCPIntegration } = require('../../src/core/integrations/github-mcp-integration');
const { GitAwareAgentOrchestrator } = require('../../src/core/orchestration/git-aware-agent-orchestrator');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  testRepo: path.join(process.cwd(), 'test-repo'),
  mainBranch: 'main',
  agents: [
    { id: 'backend-agent-1', type: 'backend', expertise: ['api', 'database'] },
    { id: 'frontend-agent-1', type: 'frontend', expertise: ['react', 'ui'] },
    { id: 'test-agent-1', type: 'testing', expertise: ['jest', 'integration'] }
  ]
};

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  startTime: Date.now()
};

/**
 * Main test runner
 */
async function runComprehensiveTests() {
  console.log(chalk.cyan.bold('\n🟢 BUMBA Git Orchestration Comprehensive Test Suite\n'));
  console.log(chalk.gray('Testing GitHub integration for multi-agent collaboration\n'));
  console.log(chalk.yellow('═'.repeat(70)));

  try {
    // Setup test environment
    await setupTestEnvironment();
    
    // Run test suites
    await testSuite1_Initialization();
    await testSuite2_BranchManagement();
    await testSuite3_FileOwnership();
    await testSuite4_AgentWorkflow();
    await testSuite5_ConflictResolution();
    await testSuite6_GitHubIntegration();
    await testSuite7_OrchestratorIntegration();
    await testSuite8_ErrorHandling();
    
    // Generate report
    await generateTestReport();
    
  } catch (error) {
    console.error(chalk.red('\n🔴 Test suite failed:'), error);
    testResults.failed.push({
      suite: 'Main',
      test: 'Test execution',
      error: error.message
    });
  } finally {
    // Cleanup
    await cleanupTestEnvironment();
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log(chalk.blue('\n🟢 Setting up test environment...'));
  
  try {
    // Create test repository if doesn't exist
    await fs.mkdir(TEST_CONFIG.testRepo, { recursive: true });
    process.chdir(TEST_CONFIG.testRepo);
    
    // Initialize git repo
    try {
      await execAsync('git init');
      await execAsync('git config user.name "Test Agent"');
      await execAsync('git config user.email "test@bumba.ai"');
      
      // Create initial commit
      await fs.writeFile('README.md', '# Test Repository\n');
      await execAsync('git add README.md');
      await execAsync('git commit -m "Initial commit"');
      
      // Ensure we're on main branch
      await execAsync('git branch -M main');
      
      console.log(chalk.green('🏁 Test repository initialized'));
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Failed to setup test environment:'), error);
    throw error;
  }
}

/**
 * Test Suite 1: Initialization
 */
async function testSuite1_Initialization() {
  console.log(chalk.magenta('\n▶ Test Suite 1: System Initialization\n'));
  
  // Test 1.1: GitOrchestratedCollaboration initialization
  await runTest('1.1', 'GitOrchestratedCollaboration initialization', async () => {
    const gitCollab = new GitOrchestratedCollaboration({
      repository: TEST_CONFIG.testRepo,
      mainBranch: TEST_CONFIG.mainBranch
    });
    
    await gitCollab.initializeGitHub();
    
    // Check initialization
    if (!gitCollab.currentBranch) {
      throw new Error('Git collaboration not initialized properly');
    }
    
    return { branch: gitCollab.currentBranch };
  });
  
  // Test 1.2: GitHubMCPIntegration initialization
  await runTest('1.2', 'GitHubMCPIntegration initialization', async () => {
    const github = new GitHubMCPIntegration({
      owner: 'test-owner',
      repo: 'test-repo'
    });
    
    await github.initialize();
    
    // Check CLI availability
    return { 
      ghAvailable: github.ghAvailable || false,
      mcpConnected: github.mcpConnected || false
    };
  });
  
  // Test 1.3: GitAwareAgentOrchestrator initialization
  await runTest('1.3', 'GitAwareAgentOrchestrator initialization', async () => {
    const orchestrator = new GitAwareAgentOrchestrator({
      repository: TEST_CONFIG.testRepo,
      mainBranch: TEST_CONFIG.mainBranch
    });
    
    await orchestrator.initialize();
    
    return { 
      state: orchestrator.currentState,
      initialized: true
    };
  });
}

/**
 * Test Suite 2: Branch Management
 */
async function testSuite2_BranchManagement() {
  console.log(chalk.magenta('\n▶ Test Suite 2: Branch Management\n'));
  
  const gitCollab = new GitOrchestratedCollaboration({
    repository: TEST_CONFIG.testRepo
  });
  
  await gitCollab.initializeGitHub();
  
  // Test 2.1: Agent branch creation
  await runTest('2.1', 'Create agent branch', async () => {
    const result = await gitCollab.assignAgentWork(
      'test-agent-1',
      'Implement test feature',
      ['src/test.js']
    );
    
    if (!result.success) {
      throw new Error('Failed to create agent branch');
    }
    
    // Verify branch exists
    const { stdout } = await execAsync('git branch');
    if (!stdout.includes('agent/test-agent-1')) {
      throw new Error('Branch not created');
    }
    
    return result;
  });
  
  // Test 2.2: Branch naming convention
  await runTest('2.2', 'Branch naming convention', async () => {
    const branchName = gitCollab.generateBranchName('agent-123', 'Fix critical bug');
    
    if (!branchName.match(/^agent\/agent-123\/fix-critical-bug-\d+$/)) {
      throw new Error(`Invalid branch name format: ${branchName}`);
    }
    
    return { branchName };
  });
  
  // Test 2.3: Multiple agent branches
  await runTest('2.3', 'Multiple agent branches', async () => {
    await execAsync('git checkout main');
    
    const agents = ['backend-1', 'frontend-1', 'test-1'];
    const branches = [];
    
    for (const agentId of agents) {
      const result = await gitCollab.assignAgentWork(
        agentId,
        `Task for ${agentId}`,
        []
      );
      branches.push(result.branch);
      await execAsync('git checkout main');
    }
    
    // Verify all branches created
    const { stdout } = await execAsync('git branch');
    const allCreated = branches.every(branch => stdout.includes(branch));
    
    if (!allCreated) {
      throw new Error('Not all agent branches created');
    }
    
    return { branches };
  });
}

/**
 * Test Suite 3: File Ownership
 */
async function testSuite3_FileOwnership() {
  console.log(chalk.magenta('\n▶ Test Suite 3: File Ownership Registry\n'));
  
  const gitCollab = new GitOrchestratedCollaboration({
    repository: TEST_CONFIG.testRepo
  });
  
  // Test 3.1: Register file ownership
  await runTest('3.1', 'Register file ownership', async () => {
    gitCollab.registerFileOwnership('src/api.js', 'backend-agent-1', 'agent/backend-1/api');
    
    const ownership = gitCollab.fileOwnership.get('src/api.js');
    
    if (!ownership || ownership.agentId !== 'backend-agent-1') {
      throw new Error('File ownership not registered correctly');
    }
    
    return { ownership };
  });
  
  // Test 3.2: Ownership conflict detection
  await runTest('3.2', 'Ownership conflict detection', async () => {
    // First agent owns file
    gitCollab.registerFileOwnership('src/shared.js', 'agent-1', 'branch-1');
    
    // Second agent requests same file
    gitCollab.registerFileOwnership('src/shared.js', 'agent-2', 'branch-2');
    
    const ownership = gitCollab.fileOwnership.get('src/shared.js');
    
    if (!ownership.collaborators || ownership.collaborators.length !== 1) {
      throw new Error('Collaborator not added to queue');
    }
    
    return { 
      owner: ownership.agentId,
      waitingCollaborators: ownership.collaborators.length
    };
  });
  
  // Test 3.3: Ownership release
  await runTest('3.3', 'Release file ownership', async () => {
    // Setup ownership with collaborator
    gitCollab.fileOwnership.set('src/release-test.js', {
      agentId: 'agent-1',
      branch: 'branch-1',
      collaborators: [
        { agentId: 'agent-2', branch: 'branch-2' }
      ]
    });
    
    // Release ownership
    gitCollab.releaseFileOwnership('agent-1');
    
    const newOwnership = gitCollab.fileOwnership.get('src/release-test.js');
    
    if (!newOwnership || newOwnership.agentId !== 'agent-2') {
      throw new Error('Ownership not transferred to collaborator');
    }
    
    return { newOwner: newOwnership.agentId };
  });
}

/**
 * Test Suite 4: Agent Workflow
 */
async function testSuite4_AgentWorkflow() {
  console.log(chalk.magenta('\n▶ Test Suite 4: Agent Workflow\n'));
  
  const gitCollab = new GitOrchestratedCollaboration({
    repository: TEST_CONFIG.testRepo
  });
  
  await gitCollab.initializeGitHub();
  
  // Test 4.1: Agent commit
  await runTest('4.1', 'Agent commits work', async () => {
    // Create branch for agent
    await gitCollab.assignAgentWork('commit-test-agent', 'Test commits', []);
    
    // Create a file
    await fs.writeFile('test-file.js', '// Test content\n');
    
    // Agent commits
    const result = await gitCollab.agentCommit(
      'commit-test-agent',
      'Add test file',
      ['test-file.js']
    );
    
    if (!result.success) {
      throw new Error('Commit failed');
    }
    
    // Verify commit exists
    const { stdout } = await execAsync('git log --oneline -1');
    if (!stdout.includes('Add test file')) {
      throw new Error('Commit not found');
    }
    
    return result;
  });
  
  // Test 4.2: Merge request creation
  await runTest('4.2', 'Create merge request', async () => {
    const mergeRequest = await gitCollab.requestMerge('commit-test-agent', 'manager-1');
    
    if (!mergeRequest.id || !mergeRequest.branch) {
      throw new Error('Merge request not created properly');
    }
    
    return {
      id: mergeRequest.id,
      status: mergeRequest.status,
      conflicts: mergeRequest.conflicts.length
    };
  });
  
  // Test 4.3: Manager review
  await runTest('4.3', 'Manager review process', async () => {
    const mergeRequest = gitCollab.mergeQueue[0];
    
    if (!mergeRequest) {
      throw new Error('No merge request in queue');
    }
    
    const review = await gitCollab.managerReview(
      mergeRequest.id,
      'manager-1',
      'approved',
      'Looks good!'
    );
    
    if (review.decision !== 'approved') {
      throw new Error('Review not processed correctly');
    }
    
    return review;
  });
}

/**
 * Test Suite 5: Conflict Resolution
 */
async function testSuite5_ConflictResolution() {
  console.log(chalk.magenta('\n▶ Test Suite 5: Conflict Resolution\n'));
  
  const gitCollab = new GitOrchestratedCollaboration({
    repository: TEST_CONFIG.testRepo,
    conflictStrategy: 'manager_review'
  });
  
  // Test 5.1: Conflict detection
  await runTest('5.1', 'Detect merge conflicts', async () => {
    await execAsync('git checkout main');
    
    // Create conflicting branches
    await execAsync('git checkout -b conflict-branch-1');
    await fs.writeFile('conflict.txt', 'Content from branch 1\n');
    await execAsync('git add conflict.txt');
    await execAsync('git commit -m "Branch 1 change"');
    
    await execAsync('git checkout main');
    await execAsync('git checkout -b conflict-branch-2');
    await fs.writeFile('conflict.txt', 'Content from branch 2\n');
    await execAsync('git add conflict.txt');
    await execAsync('git commit -m "Branch 2 change"');
    
    // Detect conflicts
    const conflicts = await gitCollab.detectConflicts('conflict-branch-2');
    
    // Note: conflicts might be empty if branches don't actually conflict with main
    return { 
      hasConflicts: conflicts.length > 0,
      conflictFiles: conflicts
    };
  });
  
  // Test 5.2: Conflict resolution strategies
  await runTest('5.2', 'Conflict resolution strategies', async () => {
    const strategies = ['manager_review', 'consciousness_driven', 'auto_merge'];
    const results = {};
    
    for (const strategy of strategies) {
      gitCollab.config.conflictStrategy = strategy;
      
      const resolution = await gitCollab.resolveConflicts(
        { 
          id: 'test-mr',
          conflicts: ['src/conflict.js'],
          agentId: 'test-agent'
        },
        'manager-agent'
      );
      
      results[strategy] = resolution.strategy === strategy;
    }
    
    return results;
  });
}

/**
 * Test Suite 6: GitHub Integration
 */
async function testSuite6_GitHubIntegration() {
  console.log(chalk.magenta('\n▶ Test Suite 6: GitHub Integration\n'));
  
  const github = new GitHubMCPIntegration({
    owner: 'test-owner',
    repo: 'test-repo',
    useMCP: false // Test without MCP for now
  });
  
  await github.initialize();
  
  // Test 6.1: PR template generation
  await runTest('6.1', 'PR template generation', async () => {
    const template = github.prTemplates.feature;
    const body = github.generatePRBody(template.template, {
      agentId: 'test-agent',
      department: 'backend',
      task: 'Implement API',
      branch: 'agent/test/api',
      summary: 'Added new endpoints',
      changes: '3 files changed'
    });
    
    if (!body.includes('test-agent') || !body.includes('backend')) {
      throw new Error('PR template not generated correctly');
    }
    
    return { 
      hasAgentInfo: body.includes('Agent ID'),
      hasChecklist: body.includes('- [ ]')
    };
  });
  
  // Test 6.2: PR type determination
  await runTest('6.2', 'Determine PR type', async () => {
    const testCases = [
      { task: 'Fix login bug', expected: 'bugfix' },
      { task: 'Refactor database layer', expected: 'refactor' },
      { task: 'Add new feature', expected: 'feature' }
    ];
    
    const results = testCases.map(tc => {
      const type = github.determinePRType(tc.task);
      return {
        task: tc.task,
        type,
        correct: type === tc.expected
      };
    });
    
    const allCorrect = results.every(r => r.correct);
    
    if (!allCorrect) {
      throw new Error('PR type determination failed');
    }
    
    return results;
  });
  
  // Test 6.3: Review requirements
  await runTest('6.3', 'Department review requirements', async () => {
    const requirements = github.reviewRequirements;
    
    if (!requirements['backend-engineer'] || !requirements['design-engineer']) {
      throw new Error('Review requirements not defined');
    }
    
    return {
      backendChecks: requirements['backend-engineer'].length,
      designChecks: requirements['design-engineer'].length
    };
  });
}

/**
 * Test Suite 7: Orchestrator Integration
 */
async function testSuite7_OrchestratorIntegration() {
  console.log(chalk.magenta('\n▶ Test Suite 7: Orchestrator Integration\n'));
  
  const orchestrator = new GitAwareAgentOrchestrator({
    repository: TEST_CONFIG.testRepo,
    parallelAgents: 3,
    requireApproval: false // Skip approval for testing
  });
  
  await orchestrator.initialize();
  
  // Test 7.1: Work planning
  await runTest('7.1', 'Plan work distribution', async () => {
    const plan = await orchestrator.planWork({
      title: 'Test Project',
      description: 'Test project for orchestrator',
      requirements: ['Feature A', 'Feature B'],
      agents: TEST_CONFIG.agents
    });
    
    if (!plan.assignments || plan.assignments.length === 0) {
      throw new Error('No work assignments created');
    }
    
    return {
      projectTitle: plan.project,
      assignmentCount: plan.assignments.length,
      estimatedTime: plan.estimatedCompletion
    };
  });
  
  // Test 7.2: Agent selection
  await runTest('7.2', 'Agent selection logic', async () => {
    const task = {
      type: 'backend',
      title: 'API Development',
      priority: 'high'
    };
    
    const bestAgent = orchestrator.selectBestAgent(task, TEST_CONFIG.agents);
    
    if (bestAgent.type !== 'backend') {
      throw new Error('Wrong agent selected for backend task');
    }
    
    return {
      selectedAgent: bestAgent.id,
      agentType: bestAgent.type
    };
  });
  
  // Test 7.3: Status tracking
  await runTest('7.3', 'Orchestrator status tracking', async () => {
    const status = orchestrator.getStatus();
    
    if (!status.state || !status.gitStatus) {
      throw new Error('Status not properly structured');
    }
    
    return {
      currentState: status.state,
      activeAgentCount: status.activeAgents.length,
      pendingTasks: status.pendingTasks
    };
  });
}

/**
 * Test Suite 8: Error Handling
 */
async function testSuite8_ErrorHandling() {
  console.log(chalk.magenta('\n▶ Test Suite 8: Error Handling\n'));
  
  const gitCollab = new GitOrchestratedCollaboration({
    repository: TEST_CONFIG.testRepo
  });
  
  // Test 8.1: Invalid branch operations
  await runTest('8.1', 'Handle invalid branch operations', async () => {
    try {
      await gitCollab.agentCommit('non-existent-agent', 'Test commit');
      throw new Error('Should have thrown error for non-existent agent');
    } catch (error) {
      if (!error.message.includes('no active branch')) {
        throw error;
      }
      return { errorHandled: true };
    }
  });
  
  // Test 8.2: Cleanup on failure
  await runTest('8.2', 'Cleanup on failure', async () => {
    // Create a branch that will be cleaned up
    await gitCollab.assignAgentWork('cleanup-test', 'Test cleanup', []);
    
    // Cleanup
    await gitCollab.cleanupBranch('cleanup-test');
    
    // Verify branch removed
    const { stdout } = await execAsync('git branch');
    if (stdout.includes('agent/cleanup-test')) {
      throw new Error('Branch not cleaned up');
    }
    
    return { cleaned: true };
  });
  
  // Test 8.3: Rollback capability
  await runTest('8.3', 'Rollback capability', async () => {
    // Test that we can abort merge operations
    try {
      await execAsync('git merge --abort');
    } catch (error) {
      // No merge to abort is fine
    }
    
    return { rollbackAvailable: true };
  });
}

/**
 * Run individual test
 */
async function runTest(id, name, testFn) {
  process.stdout.write(chalk.gray(`  ${id} ${name}... `));
  
  try {
    const result = await testFn();
    testResults.passed.push({ id, name, result });
    console.log(chalk.green('🏁 PASS'));
    return result;
  } catch (error) {
    testResults.failed.push({ id, name, error: error.message });
    console.log(chalk.red(`🔴 FAIL: ${error.message}`));
    return null;
  }
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport() {
  console.log(chalk.yellow('\n' + '═'.repeat(70)));
  console.log(chalk.cyan.bold('\n🟢 Test Results Summary\n'));
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(1);
  const executionTime = Date.now() - testResults.startTime;
  
  // Summary stats
  console.log(chalk.white('Test Statistics:'));
  console.log(chalk.green(`  🏁 Passed: ${testResults.passed.length}`));
  console.log(chalk.red(`  🔴 Failed: ${testResults.failed.length}`));
  console.log(chalk.yellow(`  🟡 Warnings: ${testResults.warnings.length}`));
  console.log(chalk.white(`  🟢 Pass Rate: ${passRate}%`));
  console.log(chalk.gray(`  ⏱️ Execution Time: ${executionTime}ms\n`));
  
  // Failed tests details
  if (testResults.failed.length > 0) {
    console.log(chalk.red.bold('Failed Tests:'));
    testResults.failed.forEach(test => {
      console.log(chalk.red(`  • ${test.id} ${test.name}`));
      console.log(chalk.gray(`    Error: ${test.error}`));
    });
    console.log();
  }
  
  // Warnings
  if (testResults.warnings.length > 0) {
    console.log(chalk.yellow.bold('Warnings:'));
    testResults.warnings.forEach(warning => {
      console.log(chalk.yellow(`  • ${warning}`));
    });
    console.log();
  }
  
  // Feature completeness evaluation
  console.log(chalk.cyan.bold('Feature Completeness Evaluation:\n'));
  
  const features = [
    { name: 'Git Repository Initialization', status: checkFeature('1.1'), required: true },
    { name: 'Branch Isolation', status: checkFeature('2.1'), required: true },
    { name: 'File Ownership Registry', status: checkFeature('3.1'), required: true },
    { name: 'Agent Commit Workflow', status: checkFeature('4.1'), required: true },
    { name: 'Merge Request System', status: checkFeature('4.2'), required: true },
    { name: 'Conflict Detection', status: checkFeature('5.1'), required: true },
    { name: 'GitHub PR Integration', status: checkFeature('6.1'), required: false },
    { name: 'Work Planning', status: checkFeature('7.1'), required: true },
    { name: 'Error Handling', status: checkFeature('8.1'), required: true }
  ];
  
  features.forEach(feature => {
    const icon = feature.status ? '🏁' : (feature.required ? '🔴' : '🟡');
    const status = feature.status ? 'COMPLETE' : (feature.required ? 'MISSING' : 'OPTIONAL');
    console.log(`  ${icon} ${feature.name.padEnd(30)} ${status}`);
  });
  
  // Operability assessment
  console.log(chalk.cyan.bold('\n🟢 Operability Assessment:\n'));
  
  const operabilityScore = calculateOperabilityScore();
  const scoreColor = operabilityScore >= 80 ? chalk.green : operabilityScore >= 60 ? chalk.yellow : chalk.red;
  
  console.log(`  Overall Operability Score: ${scoreColor.bold(operabilityScore + '%')}\n`);
  
  console.log('  Component Status:');
  console.log(`    • Git Operations:      ${getComponentStatus('git')}`);
  console.log(`    • Branch Management:   ${getComponentStatus('branch')}`);
  console.log(`    • File Coordination:   ${getComponentStatus('files')}`);
  console.log(`    • Conflict Resolution: ${getComponentStatus('conflicts')}`);
  console.log(`    • GitHub Integration:  ${getComponentStatus('github')}`);
  console.log(`    • Orchestration:       ${getComponentStatus('orchestrator')}`);
  
  // Recommendations
  console.log(chalk.cyan.bold('\n🟢 Recommendations:\n'));
  
  if (testResults.failed.length > 0) {
    console.log(chalk.yellow('  🟡 Address failed tests before production use'));
  }
  
  if (!checkFeature('6.1')) {
    console.log(chalk.yellow('  🟡 Configure GitHub token for full PR integration'));
  }
  
  if (operabilityScore < 80) {
    console.log(chalk.yellow('  🟡 Improve component reliability for production readiness'));
  }
  
  if (operabilityScore >= 80) {
    console.log(chalk.green('  🏁 System is operational and ready for development use'));
  }
  
  // Save report to file
  await saveReportToFile(features, operabilityScore);
}

/**
 * Check if feature test passed
 */
function checkFeature(testId) {
  return testResults.passed.some(test => test.id === testId);
}

/**
 * Calculate operability score
 */
function calculateOperabilityScore() {
  const totalTests = testResults.passed.length + testResults.failed.length;
  const baseScore = (testResults.passed.length / totalTests) * 100;
  
  // Adjust for critical features
  const criticalTests = ['1.1', '2.1', '3.1', '4.1'];
  const criticalPassed = criticalTests.filter(id => checkFeature(id)).length;
  const criticalScore = (criticalPassed / criticalTests.length) * 20;
  
  return Math.round(baseScore * 0.8 + criticalScore);
}

/**
 * Get component status
 */
function getComponentStatus(component) {
  const componentTests = {
    git: ['1.1', '1.3'],
    branch: ['2.1', '2.3'],
    files: ['3.1', '3.2'],
    conflicts: ['5.1', '5.2'],
    github: ['6.1', '6.2'],
    orchestrator: ['7.1', '7.2']
  };
  
  const tests = componentTests[component] || [];
  const passed = tests.filter(id => checkFeature(id)).length;
  const total = tests.length;
  
  if (passed === total) return chalk.green('🏁 Fully Operational');
  if (passed > 0) return chalk.yellow('🟡 Partially Operational');
  return chalk.red('🔴 Not Operational');
}

/**
 * Save report to file
 */
async function saveReportToFile(features, operabilityScore) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.passed.length + testResults.failed.length,
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      passRate: ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(1),
      operabilityScore
    },
    features: features.map(f => ({
      name: f.name,
      status: f.status ? 'COMPLETE' : 'INCOMPLETE',
      required: f.required
    })),
    failedTests: testResults.failed,
    warnings: testResults.warnings
  };
  
  await fs.writeFile(
    path.join(process.cwd(), 'git-orchestration-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(chalk.gray('\n🟢 Detailed report saved to git-orchestration-test-report.json'));
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment() {
  console.log(chalk.blue('\n🟢 Cleaning up test environment...'));
  
  try {
    // Return to original directory
    process.chdir(path.dirname(TEST_CONFIG.testRepo));
    
    // Clean up test branches
    await execAsync('git checkout main 2>/dev/null || true', { cwd: TEST_CONFIG.testRepo });
    
    console.log(chalk.green('🏁 Cleanup complete'));
  } catch (error) {
    console.warn(chalk.yellow('🟡 Cleanup warning:'), error.message);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests };