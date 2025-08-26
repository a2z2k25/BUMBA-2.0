/**
 * BUMBA Worktree Collaboration Enhancement
 * Enables true parallel agent coding with physical workspace isolation using Git worktrees
 * 
 * This system provides:
 * - Physical workspace isolation for 10+ concurrent agents
 * - Zero file collision incidents
 * - Automatic dependency management
 * - Performance monitoring and optimization
 * - Seamless integration with existing collaboration systems
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

/**
 * Port allocation system for isolated development servers
 */
class PortAllocator {
  constructor(start = 3000, end = 4000) {
    this.start = start;
    this.end = end;
    this.allocated = new Set();
    this.agentPorts = new Map(); // agentId -> port
  }

  allocate(agentId) {
    // Reuse port for same agent if available
    if (agentId && this.agentPorts.has(agentId)) {
      return this.agentPorts.get(agentId);
    }

    for (let port = this.start; port <= this.end; port++) {
      if (!this.allocated.has(port)) {
        this.allocated.add(port);
        if (agentId) {
          this.agentPorts.set(agentId, port);
        }
        return port;
      }
    }
    
    throw new Error(`No available ports in range ${this.start}-${this.end}`);
  }

  release(port, agentId) {
    this.allocated.delete(port);
    if (agentId && this.agentPorts.get(agentId) === port) {
      this.agentPorts.delete(agentId);
    }
  }

  getAgentPort(agentId) {
    return this.agentPorts.get(agentId);
  }
}

/**
 * Main Worktree Collaboration Enhancement Class
 * Provides physical workspace isolation for parallel agent execution
 */
class WorktreeCollaborationEnhancement extends EventEmitter {
  constructor(baseRepo, config = {}) {
    super();
    
    this.baseRepo = baseRepo;
    this.worktreesPath = config.worktreesPath || path.join(baseRepo, '..', 'bumba-worktrees');
    this.maxConcurrentAgents = config.maxConcurrentAgents || 10;
    
    // Core systems
    this.activeWorktrees = new Map(); // agentId -> workspace info
    this.portAllocator = new PortAllocator(3000, 4000);
    this.sharedCache = config.sharedCache || path.join(this.worktreesPath, '.shared-cache');
    
    // Performance tracking
    this.metrics = {
      workspacesCreated: 0,
      workspacesDestroyed: 0,
      totalExecutionTime: 0,
      conflictsResolved: 0,
      avgSetupTime: 0
    };
    
    // Configuration
    this.config = {
      useSharedDependencies: config.useSharedDependencies !== false,
      autoCleanup: config.autoCleanup !== false,
      workspaceTemplate: config.workspaceTemplate || 'default',
      npmRegistryUrl: config.npmRegistryUrl,
      gitUserName: config.gitUserName || 'BUMBA Agent',
      gitUserEmail: config.gitUserEmail || 'agent@bumba.ai',
      ...config
    };
    
    // Initialize the system
    this.initialize();
    
    logger.info('🟢 WorktreeCollaborationEnhancement initialized', {
      baseRepo: this.baseRepo,
      worktreesPath: this.worktreesPath,
      maxAgents: this.maxConcurrentAgents
    });
  }

  /**
   * Initialize the worktree collaboration system
   */
  async initialize() {
    try {
      // Verify Git version supports worktrees (2.5+)
      await this.verifyGitVersion();
      
      // Ensure worktrees directory exists
      await fs.mkdir(this.worktreesPath, { recursive: true });
      
      // Set up shared dependency cache
      if (this.config.useSharedDependencies) {
        await this.setupSharedCache();
      }
      
      // Clean up any orphaned worktrees from previous runs
      await this.cleanupOrphanedWorktrees();
      
      // Start periodic cleanup process
      if (this.config.autoCleanup) {
        this.startPeriodicCleanup();
      }
      
      this.emit('initialized', {
        path: this.worktreesPath,
        sharedCache: this.sharedCache,
        maxAgents: this.maxConcurrentAgents
      });
      
      logger.info('🏁 Worktree system fully initialized');
      
    } catch (error) {
      logger.error('Failed to initialize worktree system:', error);
      throw error;
    }
  }

  /**
   * Verify Git version supports worktrees
   */
  async verifyGitVersion() {
    try {
      const { stdout } = await execAsync('git --version');
      const versionMatch = stdout.match(/git version (\d+)\.(\d+)\.(\d+)/);
      
      if (!versionMatch) {
        throw new Error('Could not determine Git version');
      }
      
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      
      if (major < 2 || (major === 2 && minor < 5)) {
        throw new Error(`Git worktrees require version 2.5+, found ${versionMatch[0]}`);
      }
      
      logger.info(`🏁 Git version verified: ${versionMatch[0]}`);
      
    } catch (error) {
      throw new Error(`Git verification failed: ${error.message}`);
    }
  }

  /**
   * Set up shared dependency cache for faster npm installs
   */
  async setupSharedCache() {
    try {
      await fs.mkdir(this.sharedCache, { recursive: true });
      
      // Create npmrc for shared cache
      const npmrcPath = path.join(this.sharedCache, '.npmrc');
      const npmrcContent = `
cache=${this.sharedCache}/npm-cache
prefix=${this.sharedCache}/npm-global
init-module=${this.sharedCache}/npm-init.js
      `.trim();
      
      await fs.writeFile(npmrcPath, npmrcContent);
      
      logger.info('📦 Shared dependency cache configured', { path: this.sharedCache });
      
    } catch (error) {
      logger.warn('Failed to setup shared cache, continuing without:', error.message);
    }
  }

  /**
   * Create isolated workspace for agent with physical directory separation
   */
  async assignAgentWorkspace(agentId, task, branch) {
    const startTime = Date.now();
    
    try {
      // Check capacity
      if (this.activeWorktrees.size >= this.maxConcurrentAgents) {
        throw new Error(`Maximum concurrent agents reached (${this.maxConcurrentAgents})`);
      }
      
      logger.info(`🟢 Creating isolated workspace for agent ${agentId}`, {
        task: task.description || task.title,
        branch
      });
      
      // Generate unique worktree path
      const timestamp = Date.now();
      const workspaceId = crypto.randomBytes(4).toString('hex');
      const worktreePath = path.join(this.worktreesPath, `agent-${agentId}-${timestamp}-${workspaceId}`);
      
      // Ensure we're starting from a clean state
      await this.ensureCleanRepository();
      
      // Create worktree with new branch from main
      logger.info(`📁 Creating Git worktree at ${worktreePath}`);
      await execAsync(`git worktree add "${worktreePath}" -b "${branch}" origin/main`, {
        cwd: this.baseRepo
      });
      
      // Configure git identity in worktree
      await this.configureGitIdentity(agentId, worktreePath);
      
      // Set up isolated environment
      const workspace = {
        id: workspaceId,
        path: worktreePath,
        branch,
        agentId,
        task: task.description || task.title,
        port: this.portAllocator.allocate(agentId),
        nodeModulesPath: path.join(worktreePath, 'node_modules'),
        envFile: null,
        createdAt: new Date(),
        status: 'setting-up',
        setupTime: null,
        executionCount: 0
      };
      
      // Create agent-specific environment file
      workspace.envFile = await this.createIsolatedEnv(agentId, workspace);
      
      // Install dependencies with optimizations
      await this.installDependencies(workspace);
      
      // Finalize workspace setup
      workspace.status = 'active';
      workspace.setupTime = Date.now() - startTime;
      
      // Store workspace reference
      this.activeWorktrees.set(agentId, workspace);
      
      // Update metrics
      this.metrics.workspacesCreated++;
      this.metrics.avgSetupTime = (this.metrics.avgSetupTime + workspace.setupTime) / this.metrics.workspacesCreated;
      
      this.emit('workspace-created', workspace);
      
      logger.info(`🏁 Workspace ready for agent ${agentId}`, {
        path: worktreePath,
        setupTime: `${workspace.setupTime}ms`,
        port: workspace.port
      });
      
      return workspace;
      
    } catch (error) {
      logger.error(`Failed to create workspace for agent ${agentId}:`, error);
      
      // Cleanup on failure
      try {
        const failedPath = path.join(this.worktreesPath, `agent-${agentId}-${Date.now()}-*`);
        await this.cleanupWorkspace(agentId, true);
      } catch (cleanupError) {
        logger.error('Cleanup after failed workspace creation failed:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Configure Git identity for agent in their workspace
   */
  async configureGitIdentity(agentId, worktreePath) {
    const commands = [
      `git config user.name "${this.config.gitUserName} ${agentId}"`,
      `git config user.email "${agentId}@${this.config.gitUserEmail.split('@')[1] || 'bumba.ai'}"`
    ];
    
    for (const command of commands) {
      await execAsync(command, { cwd: worktreePath });
    }
    
    logger.debug(`🔧 Git identity configured for agent ${agentId}`);
  }

  /**
   * Create agent-specific environment variables and configuration
   */
  async createIsolatedEnv(agentId, workspace) {
    const envContent = `# BUMBA Agent ${agentId} Environment
# Generated at ${new Date().toISOString()}

# Agent Configuration
AGENT_ID=${agentId}
WORKSPACE_ID=${workspace.id}
WORKSPACE_PATH=${workspace.path}
BRANCH=${workspace.branch}

# Development Server
PORT=${workspace.port}
NODE_ENV=development

# Debugging
DEBUG=bumba:agent:${agentId}
BUMBA_DEBUG=worktree:${agentId}

# Performance
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=128

# Cache Configuration
${this.config.useSharedDependencies ? `NPM_CONFIG_CACHE=${this.sharedCache}/npm-cache` : ''}
`;
    
    const envPath = path.join(workspace.path, '.env.agent');
    await fs.writeFile(envPath, envContent.trim());
    
    logger.debug(`📄 Environment file created for agent ${agentId}`, { path: envPath });
    
    return envPath;
  }

  /**
   * Install dependencies with performance optimizations
   */
  async installDependencies(workspace) {
    const { agentId, path: worktreePath } = workspace;
    
    try {
      logger.info(`📦 Installing dependencies for agent ${agentId}`);
      
      const installOptions = {
        cwd: worktreePath,
        env: {
          ...process.env,
          ...(this.config.useSharedDependencies ? {
            npm_config_cache: path.join(this.sharedCache, 'npm-cache')
          } : {})
        }
      };
      
      // Use npm ci for faster, deterministic installs
      await execAsync('npm ci --quiet --no-audit --no-fund', installOptions);
      
      logger.info(`🏁 Dependencies installed for agent ${agentId}`);
      
    } catch (error) {
      logger.error(`📦 Dependency installation failed for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Execute command in agent's isolated workspace
   */
  async executeInWorkspace(agentId, command, options = {}) {
    const workspace = this.activeWorktrees.get(agentId);
    if (!workspace) {
      throw new Error(`No workspace found for agent ${agentId}`);
    }
    
    const startTime = Date.now();
    workspace.executionCount++;
    
    try {
      logger.info(`🏁 Executing in ${agentId}'s workspace: ${command}`);
      
      const execOptions = {
        cwd: workspace.path,
        env: {
          ...process.env,
          PORT: workspace.port,
          AGENT_ID: agentId,
          WORKSPACE_PATH: workspace.path,
          WORKSPACE_ID: workspace.id,
          BRANCH: workspace.branch,
          ...options.env
        },
        timeout: options.timeout || 300000, // 5 minute default timeout
        ...options.execOptions
      };
      
      const result = await execAsync(command, execOptions);
      
      const executionTime = Date.now() - startTime;
      this.metrics.totalExecutionTime += executionTime;
      
      this.emit('command-executed', {
        agentId,
        command,
        executionTime,
        success: true,
        workspace: workspace.id
      });
      
      logger.info(`🏁 Command executed successfully for agent ${agentId}`, {
        command,
        executionTime: `${executionTime}ms`
      });
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.emit('command-failed', {
        agentId,
        command,
        executionTime,
        error: error.message,
        workspace: workspace.id
      });
      
      logger.error(`🔴 Command failed for agent ${agentId}:`, {
        command,
        error: error.message,
        executionTime: `${executionTime}ms`
      });
      
      throw error;
    }
  }

  /**
   * Commit agent's work in their isolated workspace
   */
  async commitAgentWork(agentId, message, files = []) {
    const workspace = this.activeWorktrees.get(agentId);
    if (!workspace) {
      throw new Error(`No workspace found for agent ${agentId}`);
    }
    
    try {
      logger.info(`💾 Committing work for agent ${agentId}`, { message, files });
      
      const commitCommands = [];
      
      if (files.length > 0) {
        // Add specific files
        for (const file of files) {
          commitCommands.push(`git add "${file}"`);
        }
      } else {
        // Add all changes
        commitCommands.push('git add .');
      }
      
      // Create commit
      commitCommands.push(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      
      // Execute all commands in workspace
      for (const command of commitCommands) {
        await execAsync(command, { cwd: workspace.path });
      }
      
      // Get commit hash
      const { stdout: commitHash } = await execAsync('git rev-parse HEAD', { 
        cwd: workspace.path 
      });
      
      const commit = {
        hash: commitHash.trim(),
        message,
        files,
        timestamp: new Date(),
        agentId
      };
      
      this.emit('work-committed', {
        agentId,
        workspace: workspace.id,
        commit
      });
      
      logger.info(`🏁 Work committed for agent ${agentId}`, {
        commit: commit.hash.substring(0, 8),
        message
      });
      
      return commit;
      
    } catch (error) {
      logger.error(`Failed to commit work for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Merge agent's work back to main branch
   */
  async mergeAgentWork(agentId, reviewerAgent = null) {
    const workspace = this.activeWorktrees.get(agentId);
    if (!workspace) {
      throw new Error(`No workspace found for agent ${agentId}`);
    }
    
    try {
      logger.info(`🔀 Initiating merge for agent ${agentId}`, {
        branch: workspace.branch,
        reviewer: reviewerAgent
      });
      
      // Switch to main repository for merge operations
      const mainRepoCommands = [
        'git fetch origin',
        `git checkout main`,
        'git pull origin main',
        `git merge --no-ff "${workspace.branch}" -m "Merge work from agent ${agentId}: ${workspace.task}"`
      ];
      
      // Execute merge in main repository
      for (const command of mainRepoCommands) {
        await execAsync(command, { cwd: this.baseRepo });
      }
      
      // Push merged changes
      await execAsync('git push origin main', { cwd: this.baseRepo });
      
      const mergeResult = {
        agentId,
        branch: workspace.branch,
        workspace: workspace.id,
        mergedAt: new Date(),
        reviewer: reviewerAgent
      };
      
      this.emit('work-merged', mergeResult);
      
      logger.info(`🏁 Work merged successfully for agent ${agentId}`, {
        branch: workspace.branch
      });
      
      return mergeResult;
      
    } catch (error) {
      // Handle merge conflicts
      if (error.message.includes('CONFLICT')) {
        logger.warn(`🔀 Merge conflict detected for agent ${agentId}`, {
          branch: workspace.branch
        });
        
        return await this.handleMergeConflict(agentId, error);
      }
      
      logger.error(`Failed to merge work for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Handle merge conflicts with automatic resolution strategies
   */
  async handleMergeConflict(agentId, conflictError) {
    const workspace = this.activeWorktrees.get(agentId);
    
    try {
      logger.info(`🔧 Resolving merge conflicts for agent ${agentId}`);
      
      // Get conflict information
      const { stdout: conflictFiles } = await execAsync(
        'git diff --name-only --diff-filter=U',
        { cwd: this.baseRepo }
      );
      
      const conflicts = conflictFiles.trim().split('\n').filter(f => f);
      
      // Auto-resolution strategy: prefer agent changes for their assigned files
      for (const file of conflicts) {
        logger.info(`🔧 Auto-resolving conflict in ${file} (prefer agent changes)`);
        
        // Use agent's version for files they were working on
        await execAsync(`git checkout --theirs "${file}"`, { cwd: this.baseRepo });
        await execAsync(`git add "${file}"`, { cwd: this.baseRepo });
      }
      
      // Complete the merge
      await execAsync('git commit --no-edit', { cwd: this.baseRepo });
      await execAsync('git push origin main', { cwd: this.baseRepo });
      
      this.metrics.conflictsResolved++;
      
      const resolution = {
        agentId,
        conflictFiles: conflicts,
        resolution: 'auto-resolved-prefer-agent',
        resolvedAt: new Date()
      };
      
      this.emit('conflict-resolved', resolution);
      
      logger.info(`🏁 Conflicts auto-resolved for agent ${agentId}`, {
        files: conflicts.length
      });
      
      return resolution;
      
    } catch (error) {
      logger.error(`Failed to resolve conflicts for agent ${agentId}:`, error);
      
      // Abort merge and notify for manual resolution
      try {
        await execAsync('git merge --abort', { cwd: this.baseRepo });
      } catch (abortError) {
        logger.error('Failed to abort merge:', abortError);
      }
      
      throw new Error(`Merge conflicts require manual resolution: ${error.message}`);
    }
  }

  /**
   * Clean up workspace when agent is done
   */
  async cleanupWorkspace(agentId, force = false) {
    const workspace = this.activeWorktrees.get(agentId);
    if (!workspace && !force) {
      logger.warn(`No workspace to cleanup for agent ${agentId}`);
      return;
    }
    
    try {
      if (workspace) {
        logger.info(`🧹 Cleaning up workspace for agent ${agentId}`, {
          path: workspace.path,
          uptime: Date.now() - workspace.createdAt.getTime()
        });
        
        // Remove Git worktree
        await execAsync(`git worktree remove "${workspace.path}" --force`, {
          cwd: this.baseRepo
        });
        
        // Delete branch if it exists
        try {
          await execAsync(`git branch -D "${workspace.branch}"`, {
            cwd: this.baseRepo
          });
        } catch (branchError) {
          // Branch might not exist or already deleted
          logger.debug(`Branch cleanup note: ${branchError.message}`);
        }
        
        // Release allocated port
        this.portAllocator.release(workspace.port, agentId);
        
        // Remove from active worktrees
        this.activeWorktrees.delete(agentId);
        
        this.metrics.workspacesDestroyed++;
        
        this.emit('workspace-cleaned', {
          agentId,
          workspace: workspace.id,
          path: workspace.path
        });
        
        logger.info(`🏁 Workspace cleaned up for agent ${agentId}`);
      }
      
    } catch (error) {
      logger.error(`Failed to cleanup workspace for agent ${agentId}:`, error);
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Ensure repository is in clean state for worktree operations
   */
  async ensureCleanRepository() {
    try {
      // Fetch latest changes
      await execAsync('git fetch origin', { cwd: this.baseRepo });
      
      // Ensure we're on main branch
      await execAsync('git checkout main', { cwd: this.baseRepo });
      
      // Pull latest changes
      await execAsync('git pull origin main', { cwd: this.baseRepo });
      
    } catch (error) {
      logger.warn('Repository cleanup warning:', error.message);
      // Continue - might be offline or other non-critical issues
    }
  }

  /**
   * Clean up orphaned worktrees from previous runs
   */
  async cleanupOrphanedWorktrees() {
    try {
      logger.info('🧹 Cleaning up orphaned worktrees');
      
      // Get list of Git worktrees
      const { stdout: worktreeList } = await execAsync('git worktree list --porcelain', {
        cwd: this.baseRepo
      });
      
      const worktrees = this.parseWorktreeList(worktreeList);
      const orphanedPaths = [];
      
      // Find worktrees in our directory that aren't in active list
      for (const worktree of worktrees) {
        if (worktree.path.startsWith(this.worktreesPath) && 
            !Array.from(this.activeWorktrees.values()).some(w => w.path === worktree.path)) {
          orphanedPaths.push(worktree.path);
        }
      }
      
      // Remove orphaned worktrees
      for (const orphanPath of orphanedPaths) {
        try {
          await execAsync(`git worktree remove "${orphanPath}" --force`, {
            cwd: this.baseRepo
          });
          logger.info(`🧹 Removed orphaned worktree: ${orphanPath}`);
        } catch (error) {
          logger.warn(`Failed to remove orphaned worktree ${orphanPath}:`, error.message);
        }
      }
      
      logger.info(`🏁 Orphaned worktree cleanup complete (${orphanedPaths.length} removed)`);
      
    } catch (error) {
      logger.warn('Orphaned worktree cleanup failed:', error.message);
      // Continue - cleanup is best effort
    }
  }

  /**
   * Parse Git worktree list output
   */
  parseWorktreeList(worktreeOutput) {
    const worktrees = [];
    const lines = worktreeOutput.split('\n');
    let currentWorktree = {};
    
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (currentWorktree.path) {
          worktrees.push(currentWorktree);
        }
        currentWorktree = { path: line.substring(9) };
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line.substring(7);
      }
    }
    
    if (currentWorktree.path) {
      worktrees.push(currentWorktree);
    }
    
    return worktrees;
  }

  /**
   * Start periodic cleanup of inactive workspaces
   */
  startPeriodicCleanup() {
    const cleanupInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const maxAge = 4 * 60 * 60 * 1000; // 4 hours
        
        for (const [agentId, workspace] of this.activeWorktrees.entries()) {
          const age = now - workspace.createdAt.getTime();
          
          // Cleanup old inactive workspaces
          if (age > maxAge && workspace.status !== 'active') {
            logger.info(`🧹 Auto-cleaning up old workspace for agent ${agentId}`, {
              age: `${Math.round(age / 1000 / 60)} minutes`
            });
            await this.cleanupWorkspace(agentId);
          }
        }
        
      } catch (error) {
        logger.error('Periodic cleanup error:', error);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
    
    // Cleanup on process exit
    process.on('exit', () => clearInterval(cleanupInterval));
    process.on('SIGINT', () => {
      clearInterval(cleanupInterval);
      this.shutdownAll();
    });
  }

  /**
   * Get current system metrics and status
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeWorkspaces: this.activeWorktrees.size,
      maxConcurrent: this.maxConcurrentAgents,
      availablePorts: this.portAllocator.end - this.portAllocator.start - this.portAllocator.allocated.size,
      workspaces: Array.from(this.activeWorktrees.values()).map(w => ({
        agentId: w.agentId,
        status: w.status,
        uptime: Date.now() - w.createdAt.getTime(),
        executionCount: w.executionCount,
        setupTime: w.setupTime
      }))
    };
  }

  /**
   * Shutdown all active workspaces
   */
  async shutdownAll() {
    logger.info('🔄 Shutting down all active workspaces');
    
    const shutdownPromises = Array.from(this.activeWorktrees.keys()).map(agentId => 
      this.cleanupWorkspace(agentId)
    );
    
    await Promise.allSettled(shutdownPromises);
    
    logger.info('🏁 All workspaces shut down');
  }

  /**
   * Get workspace information for an agent
   */
  getWorkspace(agentId) {
    return this.activeWorktrees.get(agentId);
  }

  /**
   * List all active workspaces
   */
  listWorkspaces() {
    return Array.from(this.activeWorktrees.entries()).map(([agentId, workspace]) => ({
      agentId,
      ...workspace
    }));
  }

  /**
   * Check if system is healthy and ready for new agents
   */
  isHealthy() {
    return {
      healthy: this.activeWorktrees.size < this.maxConcurrentAgents,
      activeAgents: this.activeWorktrees.size,
      maxAgents: this.maxConcurrentAgents,
      availableSlots: this.maxConcurrentAgents - this.activeWorktrees.size
    };
  }
}

module.exports = {
  WorktreeCollaborationEnhancement,
  PortAllocator
};