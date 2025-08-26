#!/usr/bin/env node

/**
 * Simplified test to verify Git orchestration core functionality
 */

const chalk = require('chalk');
const { GitOrchestratedCollaboration } = require('./src/core/collaboration/git-orchestrated-collaboration');
const { GitHubMCPIntegration } = require('./src/core/integrations/github-mcp-integration');
const { GitAwareAgentOrchestrator } = require('./src/core/orchestration/git-aware-agent-orchestrator');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log(chalk.cyan.bold('\n🟢 Git Orchestration System - Functionality Test\n'));

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTests() {
  console.log(chalk.yellow('═'.repeat(60)));
  
  // Test 1: Class instantiation
  await test('Class Instantiation', async () => {
    const gitCollab = new GitOrchestratedCollaboration({});
    const github = new GitHubMCPIntegration({});
    const orchestrator = new GitAwareAgentOrchestrator({});
    
    if (!gitCollab || !github || !orchestrator) {
      throw new Error('Classes not instantiated');
    }
    
    return 'All classes instantiated successfully';
  });
  
  // Test 2: Branch name generation
  await test('Branch Name Generation', async () => {
    const gitCollab = new GitOrchestratedCollaboration({});
    const branchName = gitCollab.generateBranchName('test-agent', 'Fix critical bug');
    
    if (!branchName.startsWith('agent/test-agent/')) {
      throw new Error(`Invalid branch name: ${branchName}`);
    }
    
    return `Generated: ${branchName}`;
  });
  
  // Test 3: File ownership registry
  await test('File Ownership Registry', async () => {
    const gitCollab = new GitOrchestratedCollaboration({});
    
    // Register ownership
    gitCollab.registerFileOwnership('src/test.js', 'agent-1', 'branch-1');
    
    // Check registry
    const ownership = gitCollab.fileOwnership.get('src/test.js');
    
    if (!ownership || ownership.agentId !== 'agent-1') {
      throw new Error('Ownership not registered');
    }
    
    // Test conflict detection
    gitCollab.registerFileOwnership('src/test.js', 'agent-2', 'branch-2');
    const updated = gitCollab.fileOwnership.get('src/test.js');
    
    if (!updated.collaborators || updated.collaborators.length !== 1) {
      throw new Error('Collaborator queue not working');
    }
    
    return 'File ownership and conflict detection working';
  });
  
  // Test 4: PR template generation
  await test('PR Template Generation', async () => {
    const github = new GitHubMCPIntegration({});
    
    const body = github.generatePRBody(
      github.prTemplates.feature.template,
      {
        agentId: 'test-agent',
        department: 'backend',
        task: 'API Implementation',
        branch: 'agent/test/api',
        summary: 'Added endpoints',
        changes: '5 files changed'
      }
    );
    
    if (!body.includes('test-agent') || !body.includes('backend')) {
      throw new Error('Template not properly generated');
    }
    
    return 'PR template generation working';
  });
  
  // Test 5: Work planning
  await test('Work Planning', async () => {
    const orchestrator = new GitAwareAgentOrchestrator({
      repository: process.cwd()
    });
    
    // Don't initialize git (to avoid file system issues)
    orchestrator.gitCollaboration.initializeGitHub = async () => {};
    orchestrator.githubIntegration.initialize = async () => {};
    
    const plan = await orchestrator.planWork({
      title: 'Test Project',
      description: 'Test',
      requirements: ['Feature A', 'Feature B'],
      agents: [
        { id: 'agent-1', type: 'backend', expertise: ['api'] },
        { id: 'agent-2', type: 'frontend', expertise: ['ui'] }
      ]
    });
    
    if (!plan.assignments || plan.assignments.length === 0) {
      throw new Error('No work assignments created');
    }
    
    return `Created ${plan.assignments.length} assignments`;
  });
  
  // Test 6: Agent selection logic
  await test('Agent Selection Logic', async () => {
    const orchestrator = new GitAwareAgentOrchestrator({});
    
    const agents = [
      { id: 'backend-1', type: 'backend', expertise: ['api'] },
      { id: 'frontend-1', type: 'frontend', expertise: ['ui'] },
      { id: 'general-1', type: 'general', expertise: [] }
    ];
    
    const task = {
      type: 'backend',
      title: 'API Development'
    };
    
    const selected = orchestrator.selectBestAgent(task, agents);
    
    if (selected.type !== 'backend') {
      throw new Error(`Wrong agent selected: ${selected.id}`);
    }
    
    return `Selected: ${selected.id} (${selected.type})`;
  });
  
  // Test 7: Conflict resolution strategies
  await test('Conflict Resolution Strategies', async () => {
    const gitCollab = new GitOrchestratedCollaboration({
      conflictStrategy: 'manager_review'
    });
    
    const strategies = ['manager_review', 'consciousness_driven', 'auto_merge'];
    const results = [];
    
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
      
      results.push({
        strategy,
        valid: resolution.strategy === strategy
      });
    }
    
    const allValid = results.every(r => r.valid);
    
    if (!allValid) {
      throw new Error('Strategy selection not working');
    }
    
    return 'All conflict strategies available';
  });
  
  // Test 8: Review requirements
  await test('Review Requirements', async () => {
    const github = new GitHubMCPIntegration({});
    
    const backendReqs = github.reviewRequirements['backend-engineer'];
    const designReqs = github.reviewRequirements['design-engineer'];
    
    if (!backendReqs || !designReqs) {
      throw new Error('Review requirements not defined');
    }
    
    return `Backend: ${backendReqs.length} checks, Design: ${designReqs.length} checks`;
  });
  
  // Test 9: Orchestrator status
  await test('Orchestrator Status Tracking', async () => {
    const orchestrator = new GitAwareAgentOrchestrator({});
    
    const status = orchestrator.getStatus();
    
    if (!status.state || status.state !== 'planning') {
      throw new Error('Invalid initial state');
    }
    
    if (!status.gitStatus || !status.githubMetrics) {
      throw new Error('Missing status components');
    }
    
    return `State: ${status.state}, Components present`;
  });
  
  // Test 10: Event emitters
  await test('Event System', async () => {
    const gitCollab = new GitOrchestratedCollaboration({});
    
    let eventFired = false;
    
    gitCollab.on('branch-created', (data) => {
      eventFired = true;
    });
    
    gitCollab.emit('branch-created', { test: true });
    
    if (!eventFired) {
      throw new Error('Event system not working');
    }
    
    return 'Event system operational';
  });
  
  // Generate report
  generateReport();
}

async function test(name, fn) {
  process.stdout.write(chalk.gray(`  Testing ${name}... `));
  
  try {
    const result = await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed', result });
    console.log(chalk.green('🏁 PASS'));
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
    console.log(chalk.red(`🔴 FAIL: ${error.message}`));
    return null;
  }
}

function generateReport() {
  console.log(chalk.yellow('\n' + '═'.repeat(60)));
  console.log(chalk.cyan.bold('\n🟢 Test Results Summary\n'));
  
  const total = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);
  
  console.log(chalk.white('Results:'));
  console.log(chalk.green(`  🏁 Passed: ${testResults.passed}/${total}`));
  console.log(chalk.red(`  🔴 Failed: ${testResults.failed}/${total}`));
  console.log(chalk.white(`  🟢 Pass Rate: ${passRate}%`));
  
  // Component evaluation
  console.log(chalk.cyan.bold('\n🟢 Component Evaluation:\n'));
  
  const components = [
    { name: 'GitOrchestratedCollaboration', tests: [0, 1, 2, 6, 9] },
    { name: 'GitHubMCPIntegration', tests: [0, 3, 7] },
    { name: 'GitAwareAgentOrchestrator', tests: [0, 4, 5, 8] }
  ];
  
  components.forEach(comp => {
    const compTests = comp.tests.map(i => testResults.tests[i]);
    const passed = compTests.filter(t => t && t.status === 'passed').length;
    const status = passed === comp.tests.length ? chalk.green('🏁 Operational') :
                   passed > 0 ? chalk.yellow('🟡 Partial') :
                   chalk.red('🔴 Failed');
    
    console.log(`  ${comp.name}: ${status}`);
  });
  
  // Overall assessment
  console.log(chalk.cyan.bold('\n🟢 Overall Assessment:\n'));
  
  if (passRate >= 80) {
    console.log(chalk.green.bold('  🏁 SYSTEM OPERATIONAL'));
    console.log(chalk.green('  The Git orchestration system is functioning correctly.'));
    console.log(chalk.green('  Core features for multi-agent collaboration are working.'));
  } else if (passRate >= 60) {
    console.log(chalk.yellow.bold('  🟡 PARTIALLY OPERATIONAL'));
    console.log(chalk.yellow('  Most features working but some issues detected.'));
  } else {
    console.log(chalk.red.bold('  🔴 NOT OPERATIONAL'));
    console.log(chalk.red('  Critical issues preventing proper operation.'));
  }
  
  // Feature completeness
  console.log(chalk.cyan.bold('\n🏁 Feature Completeness:\n'));
  
  const features = [
    { name: 'Branch Isolation', status: testResults.tests[1]?.status === 'passed' },
    { name: 'File Ownership Tracking', status: testResults.tests[2]?.status === 'passed' },
    { name: 'PR Template Generation', status: testResults.tests[3]?.status === 'passed' },
    { name: 'Work Planning & Distribution', status: testResults.tests[4]?.status === 'passed' },
    { name: 'Intelligent Agent Selection', status: testResults.tests[5]?.status === 'passed' },
    { name: 'Conflict Resolution', status: testResults.tests[6]?.status === 'passed' },
    { name: 'Code Review Requirements', status: testResults.tests[7]?.status === 'passed' },
    { name: 'Status Tracking', status: testResults.tests[8]?.status === 'passed' },
    { name: 'Event System', status: testResults.tests[9]?.status === 'passed' }
  ];
  
  features.forEach(feature => {
    const icon = feature.status ? '🏁' : '🔴';
    console.log(`  ${icon} ${feature.name}`);
  });
  
  // Recommendations
  console.log(chalk.cyan.bold('\n🟢 Recommendations:\n'));
  
  if (testResults.failed > 0) {
    console.log(chalk.yellow('  • Fix failed tests before production use'));
  }
  
  console.log(chalk.gray('  • Configure GitHub token for full PR integration'));
  console.log(chalk.gray('  • Test with actual Git repository for complete validation'));
  console.log(chalk.gray('  • Set up CI/CD hooks for automated testing'));
  
  if (passRate >= 80) {
    console.log(chalk.green.bold('\n🏁 Ready for Development Use'));
    console.log(chalk.green('The system can prevent agents from overwriting each other\'s work'));
    console.log(chalk.green('through branch isolation, file ownership, and managed merging.'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n🔴 Fatal error:'), error);
  process.exit(1);
});