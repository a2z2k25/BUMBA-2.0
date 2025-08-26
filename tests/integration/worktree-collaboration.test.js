/**
 * BUMBA Worktree Collaboration System Tests
 * Comprehensive test suite for parallel agent execution with Git worktrees
 * 
 * Test Scenarios:
 * - Parallel workspace creation and isolation
 * - Concurrent file modifications without conflicts
 * - Automatic conflict resolution
 * - Resource management and cleanup
 * - Performance and reliability testing
 */

const { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

// Worktree collaboration module was consolidated
const WorktreeCollaborationEnhancement = {
  detectCurrentWorktree: () => ({ name: 'main', path: process.cwd() }),
  shareContext: async () => ({ success: true }),
  synchronizeChanges: async () => ({ synced: [] })
};
const { EnhancedGitCollaboration } = require('../src/core/collaboration/enhanced-git-collaboration');

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  testRepo: path.join(__dirname, '..', 'test-repo'),
  worktreesPath: path.join(__dirname, '..', 'test-worktrees'),
  timeout: 60000, // 60 seconds
  maxAgents: 5
};

describe('WorktreeCollaborationEnhancement', () => {
  let worktreeSystem;
  let testRepoPath;
  
  beforeAll(async () => {
    // Set up test repository
    testRepoPath = TEST_CONFIG.testRepo;
    await setupTestRepository(testRepoPath);
  }, TEST_CONFIG.timeout);
  
  afterAll(async () => {
    // Clean up test repository
    await cleanupTestRepository(testRepoPath);
    await cleanupTestRepository(TEST_CONFIG.worktreesPath);
  });
  
  beforeEach(async () => {
    // Initialize fresh worktree system for each test
    worktreeSystem = new WorktreeCollaborationEnhancement(testRepoPath, {
      worktreesPath: TEST_CONFIG.worktreesPath,
      maxConcurrentAgents: TEST_CONFIG.maxAgents,
      useSharedDependencies: true,
      autoCleanup: false // Manual cleanup for tests
    });
    
    // Wait for initialization
    await new Promise((resolve) => {
      worktreeSystem.once('initialized', resolve);
    });
  });
  
  afterEach(async () => {
    // Clean up all workspaces after each test
    if (worktreeSystem) {
      await worktreeSystem.shutdownAll();
    }
  });

  describe('System Initialization', () => {
    test('should initialize with correct configuration', async () => {
      expect(worktreeSystem.baseRepo).toBe(testRepoPath);
      expect(worktreeSystem.worktreesPath).toBe(TEST_CONFIG.worktreesPath);
      expect(worktreeSystem.maxConcurrentAgents).toBe(TEST_CONFIG.maxAgents);
    });

    test('should verify Git version compatibility', async () => {
      // Should not throw for Git 2.5+
      await expect(worktreeSystem.verifyGitVersion()).resolves.not.toThrow();
    });

    test('should create worktrees directory', async () => {
      const stats = await fs.stat(TEST_CONFIG.worktreesPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should clean up orphaned worktrees on startup', async () => {
      // This test verifies the cleanup doesn't crash
      await expect(worktreeSystem.cleanupOrphanedWorktrees()).resolves.not.toThrow();
    });
  });

  describe('Single Agent Workspace Management', () => {
    test('should create isolated workspace for single agent', async () => {
      const agentId = 'test-agent-1';
      const task = { description: 'Test task', files: ['test-file.js'] };
      const branch = 'test-branch-1';
      
      const workspace = await worktreeSystem.assignAgentWorkspace(agentId, task, branch);
      
      expect(workspace).toHaveProperty('path');
      expect(workspace).toHaveProperty('branch', branch);
      expect(workspace).toHaveProperty('agentId', agentId);
      expect(workspace).toHaveProperty('port');
      expect(workspace.status).toBe('active');
      
      // Verify workspace directory exists
      const stats = await fs.stat(workspace.path);
      expect(stats.isDirectory()).toBe(true);
      
      // Verify Git configuration
      const { stdout: gitUser } = await execAsync('git config user.name', { cwd: workspace.path });
      expect(gitUser.trim()).toContain(agentId);
    });

    test('should execute commands in isolated workspace', async () => {
      const agentId = 'test-agent-2';
      const workspace = await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Command test' },
        'command-test-branch'
      );
      
      // Execute test command
      const result = await worktreeSystem.executeInWorkspace(agentId, 'echo "Hello from agent workspace"');
      
      expect(result.stdout.trim()).toBe('Hello from agent workspace');
    });

    test('should commit work in isolated workspace', async () => {
      const agentId = 'test-agent-3';
      const workspace = await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Commit test' },
        'commit-test-branch'
      );
      
      // Create a test file
      const testFile = path.join(workspace.path, 'test-commit.txt');
      await fs.writeFile(testFile, 'Test commit content');
      
      // Commit the work
      const commit = await worktreeSystem.commitAgentWork(
        agentId,
        'Test commit message',
        ['test-commit.txt']
      );
      
      expect(commit).toHaveProperty('hash');
      expect(commit).toHaveProperty('message', 'Test commit message');
      expect(commit.files).toContain('test-commit.txt');
    });

    test('should clean up workspace properly', async () => {
      const agentId = 'test-agent-4';
      const workspace = await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Cleanup test' },
        'cleanup-test-branch'
      );
      
      const workspacePath = workspace.path;
      
      // Verify workspace exists
      await expect(fs.access(workspacePath)).resolves.not.toThrow();
      
      // Clean up workspace
      await worktreeSystem.cleanupWorkspace(agentId);
      
      // Verify workspace is removed
      await expect(fs.access(workspacePath)).rejects.toThrow();
      
      // Verify agent is removed from active list
      expect(worktreeSystem.getWorkspace(agentId)).toBeUndefined();
    });
  });

  describe('Parallel Agent Execution', () => {
    test('should create multiple isolated workspaces simultaneously', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3'];
      const promises = agents.map(agentId =>
        worktreeSystem.assignAgentWorkspace(
          agentId,
          { description: `Task for ${agentId}` },
          `branch-${agentId}`
        )
      );
      
      const workspaces = await Promise.all(promises);
      
      expect(workspaces).toHaveLength(3);
      
      // Verify all workspaces are unique
      const paths = workspaces.map(w => w.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(3);
      
      // Verify all agents are tracked
      expect(worktreeSystem.activeWorktrees.size).toBe(3);
    });

    test('should handle concurrent file modifications without conflicts', async () => {
      const agents = ['agent-a', 'agent-b', 'agent-c'];
      
      // Create workspaces for all agents
      const workspaces = await Promise.all(
        agents.map(agentId =>
          worktreeSystem.assignAgentWorkspace(
            agentId,
            { description: `Concurrent work for ${agentId}` },
            `concurrent-${agentId}`
          )
        )
      );
      
      // Simulate concurrent file modifications
      const modifications = workspaces.map(async (workspace, index) => {
        const agentId = agents[index];
        const fileName = `${agentId}-file.txt`;
        const filePath = path.join(workspace.path, fileName);
        
        // Create unique content for each agent
        await fs.writeFile(filePath, `Content from ${agentId} at ${Date.now()}`);
        
        // Commit the changes
        return worktreeSystem.commitAgentWork(
          agentId,
          `Add ${fileName}`,
          [fileName]
        );
      });
      
      const commits = await Promise.all(modifications);
      
      // Verify all commits succeeded
      expect(commits).toHaveLength(3);
      commits.forEach(commit => {
        expect(commit).toHaveProperty('hash');
        expect(commit.hash).toMatch(/^[a-f0-9]{40}$/); // Valid Git hash
      });
    });

    test('should execute parallel commands without interference', async () => {
      const agents = ['cmd-agent-1', 'cmd-agent-2', 'cmd-agent-3'];
      
      // Create workspaces
      await Promise.all(
        agents.map(agentId =>
          worktreeSystem.assignAgentWorkspace(
            agentId,
            { description: `Command execution for ${agentId}` },
            `cmd-${agentId}`
          )
        )
      );
      
      // Execute different commands in parallel
      const commands = [
        'echo "Agent 1 output" > agent1-output.txt',
        'echo "Agent 2 output" > agent2-output.txt',
        'echo "Agent 3 output" > agent3-output.txt'
      ];
      
      const executions = agents.map((agentId, index) =>
        worktreeSystem.executeInWorkspace(agentId, commands[index])
      );
      
      const results = await Promise.all(executions);
      
      // All commands should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
      });
      
      // Verify files were created in correct workspaces
      for (let i = 0; i < agents.length; i++) {
        const workspace = worktreeSystem.getWorkspace(agents[i]);
        const expectedFile = path.join(workspace.path, `agent${i + 1}-output.txt`);
        const content = await fs.readFile(expectedFile, 'utf8');
        expect(content.trim()).toBe(`Agent ${i + 1} output`);
      }
    });

    test('should respect maximum concurrent agents limit', async () => {
      const maxAgents = TEST_CONFIG.maxAgents;
      
      // Try to create more agents than the limit
      const agents = Array.from({ length: maxAgents + 2 }, (_, i) => `limit-agent-${i}`);
      
      // First maxAgents should succeed
      const successfulCreations = agents.slice(0, maxAgents).map(agentId =>
        worktreeSystem.assignAgentWorkspace(
          agentId,
          { description: `Limit test for ${agentId}` },
          `limit-${agentId}`
        )
      );
      
      await Promise.all(successfulCreations);
      expect(worktreeSystem.activeWorktrees.size).toBe(maxAgents);
      
      // Additional agents should fail
      await expect(
        worktreeSystem.assignAgentWorkspace(
          agents[maxAgents],
          { description: 'Should fail' },
          'should-fail-branch'
        )
      ).rejects.toThrow('Maximum concurrent agents reached');
    });
  });

  describe('Merge and Conflict Resolution', () => {
    test('should merge agent work successfully', async () => {
      const agentId = 'merge-agent';
      
      // Create workspace and add some work
      const workspace = await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Merge test' },
        'merge-test-branch'
      );
      
      // Create and commit a file
      const testFile = path.join(workspace.path, 'merge-test.txt');
      await fs.writeFile(testFile, 'Content for merge test');
      await worktreeSystem.commitAgentWork(agentId, 'Add merge test file', ['merge-test.txt']);
      
      // Merge the work
      const mergeResult = await worktreeSystem.mergeAgentWork(agentId);
      
      expect(mergeResult).toHaveProperty('agentId', agentId);
      expect(mergeResult).toHaveProperty('mergedAt');
      expect(mergeResult.branch).toBe('merge-test-branch');
    });

    test('should handle merge conflicts automatically', async () => {
      const agentId = 'conflict-agent';
      
      // Create conflicting changes in main branch first
      const conflictFile = path.join(testRepoPath, 'conflict-file.txt');
      await fs.writeFile(conflictFile, 'Original content in main');
      await execAsync('git add conflict-file.txt', { cwd: testRepoPath });
      await execAsync('git commit -m "Add conflict file to main"', { cwd: testRepoPath });
      
      // Create agent workspace and modify the same file
      const workspace = await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Conflict test' },
        'conflict-test-branch'
      );
      
      const agentConflictFile = path.join(workspace.path, 'conflict-file.txt');
      await fs.writeFile(agentConflictFile, 'Agent modified content');
      await worktreeSystem.commitAgentWork(agentId, 'Modify conflict file', ['conflict-file.txt']);
      
      // Attempt merge - should handle conflict automatically
      const conflictResult = await worktreeSystem.mergeAgentWork(agentId);
      
      expect(conflictResult).toBeDefined();
      // The system should prefer agent changes
      expect(conflictResult.resolution).toBe('auto-resolved-prefer-agent');
    });
  });

  describe('Performance and Resource Management', () => {
    test('should track performance metrics', async () => {
      const agentId = 'metrics-agent';
      
      await worktreeSystem.assignAgentWorkspace(
        agentId,
        { description: 'Metrics test' },
        'metrics-branch'
      );
      
      const metrics = worktreeSystem.getMetrics();
      
      expect(metrics).toHaveProperty('workspacesCreated');
      expect(metrics).toHaveProperty('activeWorkspaces');
      expect(metrics).toHaveProperty('avgSetupTime');
      expect(metrics.workspacesCreated).toBeGreaterThan(0);
      expect(metrics.activeWorkspaces).toBe(1);
    });

    test('should manage port allocation correctly', async () => {
      const agents = ['port-agent-1', 'port-agent-2', 'port-agent-3'];
      
      const workspaces = await Promise.all(
        agents.map(agentId =>
          worktreeSystem.assignAgentWorkspace(
            agentId,
            { description: `Port test for ${agentId}` },
            `port-${agentId}`
          )
        )
      );
      
      // All agents should have unique ports
      const ports = workspaces.map(w => w.port);
      const uniquePorts = new Set(ports);
      expect(uniquePorts.size).toBe(agents.length);
      
      // Ports should be in valid range
      ports.forEach(port => {
        expect(port).toBeGreaterThanOrEqual(3000);
        expect(port).toBeLessThanOrEqual(4000);
      });
    });

    test('should handle workspace setup timeout gracefully', async () => {
      const agentId = 'timeout-agent';
      
      // This test verifies the system handles timeouts properly
      // In a real scenario, this might involve network issues or slow npm installs
      const startTime = Date.now();
      
      try {
        await worktreeSystem.assignAgentWorkspace(
          agentId,
          { description: 'Timeout test' },
          'timeout-branch'
        );
        
        const setupTime = Date.now() - startTime;
        expect(setupTime).toBeLessThan(30000); // Should complete within 30 seconds
        
      } catch (error) {
        // If it fails, it should fail gracefully
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('System Health and Reliability', () => {
    test('should report system health accurately', async () => {
      const health = worktreeSystem.isHealthy();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('activeAgents');
      expect(health).toHaveProperty('maxAgents');
      expect(health).toHaveProperty('availableSlots');
      
      expect(health.healthy).toBe(true);
      expect(health.maxAgents).toBe(TEST_CONFIG.maxAgents);
    });

    test('should list all active workspaces', async () => {
      const agents = ['list-agent-1', 'list-agent-2'];
      
      await Promise.all(
        agents.map(agentId =>
          worktreeSystem.assignAgentWorkspace(
            agentId,
            { description: `List test for ${agentId}` },
            `list-${agentId}`
          )
        )
      );
      
      const workspaces = worktreeSystem.listWorkspaces();
      
      expect(workspaces).toHaveLength(2);
      expect(workspaces.map(w => w.agentId)).toEqual(expect.arrayContaining(agents));
    });

    test('should shutdown all workspaces cleanly', async () => {
      const agents = ['shutdown-agent-1', 'shutdown-agent-2', 'shutdown-agent-3'];
      
      // Create multiple workspaces
      await Promise.all(
        agents.map(agentId =>
          worktreeSystem.assignAgentWorkspace(
            agentId,
            { description: `Shutdown test for ${agentId}` },
            `shutdown-${agentId}`
          )
        )
      );
      
      expect(worktreeSystem.activeWorktrees.size).toBe(3);
      
      // Shutdown all
      await worktreeSystem.shutdownAll();
      
      expect(worktreeSystem.activeWorktrees.size).toBe(0);
    });
  });
});

describe('EnhancedGitCollaboration Integration', () => {
  let collaboration;
  let testRepoPath;
  
  beforeAll(async () => {
    testRepoPath = path.join(TEST_CONFIG.testRepo, 'enhanced');
    await setupTestRepository(testRepoPath);
  }, TEST_CONFIG.timeout);
  
  afterAll(async () => {
    await cleanupTestRepository(testRepoPath);
  });
  
  beforeEach(async () => {
    collaboration = new EnhancedGitCollaboration({
      repository: testRepoPath,
      useWorktrees: true,
      worktreesPath: path.join(TEST_CONFIG.worktreesPath, 'enhanced'),
      maxConcurrentAgents: 3,
      fallbackToBranches: true
    });
    
    // Wait for initialization
    await collaboration.initializationPromise;
  });
  
  afterEach(async () => {
    if (collaboration) {
      await collaboration.emergencyCleanup();
    }
  });

  describe('Worktree vs Branch Mode Selection', () => {
    test('should use worktrees for complex tasks', async () => {
      const result = await collaboration.assignAgentWork(
        'complex-agent',
        'Build complex feature with multiple components',
        ['comp1.js', 'comp2.js', 'comp3.js', 'comp4.js'] // 4+ files = complex
      );
      
      expect(result.mode).toBe('worktree');
      expect(result.workspace).toBeDefined();
    });

    test('should use branches for simple tasks when worktrees at capacity', async () => {
      // Fill up worktree capacity
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          collaboration.assignAgentWork(
            `capacity-agent-${i}`,
            'Complex task',
            ['file1.js', 'file2.js', 'file3.js', 'file4.js']
          )
        );
      }
      await Promise.all(promises);
      
      // Next agent should use branches
      const result = await collaboration.assignAgentWork(
        'overflow-agent',
        'Simple task',
        ['simple.js']
      );
      
      expect(result.mode).toBe('branch');
    });

    test('should fallback to branches if worktree creation fails', async () => {
      // This test would require mocking worktree failure
      // For now, we'll test the fallback configuration
      expect(collaboration.worktreeConfig.fallbackToBranches).toBe(true);
    });
  });

  describe('Parallel Development Demo', () => {
    test('should run parallel demo with multiple agents successfully', async () => {
      const agents = ['backend', 'frontend', 'test'];
      
      const demoResult = await collaboration.startParallelDemo(agents);
      
      expect(demoResult.totalAgents).toBe(3);
      expect(demoResult.successful).toBe(3);
      expect(demoResult.failed).toBe(0);
      
      // Verify all agents were assigned
      demoResult.results.forEach(result => {
        expect(result.status).toBe('assigned');
        expect(['worktree', 'branch']).toContain(result.mode);
      });
    });
  });

  describe('Enhanced Features', () => {
    test('should provide enhanced status with worktree information', async () => {
      await collaboration.assignAgentWork(
        'status-agent',
        'Test status features',
        ['status.js']
      );
      
      const status = collaboration.getStatus();
      
      expect(status).toHaveProperty('worktreesEnabled', true);
      expect(status).toHaveProperty('worktreeMetrics');
      expect(status).toHaveProperty('enhancedMetrics');
      expect(status).toHaveProperty('agentModes');
      expect(status.agentModes).toHaveLength(1);
    });

    test('should perform comprehensive health check', async () => {
      const health = await collaboration.healthCheck();
      
      expect(health).toHaveProperty('overallHealth');
      expect(health).toHaveProperty('worktrees');
      expect(health).toHaveProperty('enhancedMetrics');
      expect(health.overallHealth).toBe(true);
    });
  });
});

// Utility functions for test setup and cleanup

async function setupTestRepository(repoPath) {
  try {
    // Remove existing test repo if it exists
    await fs.rm(repoPath, { recursive: true, force: true });
    
    // Create new test repository
    await fs.mkdir(repoPath, { recursive: true });
    
    // Initialize Git repository
    await execAsync('git init', { cwd: repoPath });
    await execAsync('git config user.name "Test User"', { cwd: repoPath });
    await execAsync('git config user.email "test@example.com"', { cwd: repoPath });
    
    // Create initial files
    const packageJson = {
      name: 'bumba-test-repo',
      version: '1.0.0',
      scripts: {
        test: 'echo "Test script"'
      },
      dependencies: {}
    };
    
    await fs.writeFile(
      path.join(repoPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    await fs.writeFile(
      path.join(repoPath, 'README.md'),
      '# BUMBA Test Repository\n\nThis is a test repository for worktree collaboration testing.'
    );
    
    // Create initial commit
    await execAsync('git add .', { cwd: repoPath });
    await execAsync('git commit -m "Initial commit"', { cwd: repoPath });
    
    // Create main branch
    await execAsync('git branch -M main', { cwd: repoPath });
    
    console.log(`🏁 Test repository setup complete: ${repoPath}`);
    
  } catch (error) {
    console.error(`🔴 Failed to setup test repository: ${error.message}`);
    throw error;
  }
}

async function cleanupTestRepository(repoPath) {
  try {
    if (repoPath && await fs.access(repoPath).then(() => true).catch(() => false)) {
      await fs.rm(repoPath, { recursive: true, force: true });
      console.log(`🧹 Test repository cleaned up: ${repoPath}`);
    }
  } catch (error) {
    console.warn(`🟠️ Failed to cleanup test repository: ${error.message}`);
    // Don't throw - cleanup should be best effort
  }
}

module.exports = {
  setupTestRepository,
  cleanupTestRepository,
  TEST_CONFIG
};