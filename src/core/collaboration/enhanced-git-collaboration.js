/**
 * BUMBA Enhanced Git Collaboration with Worktree Support
 * Extends existing Git collaboration system with physical workspace isolation
 * 
 * This integration layer provides:
 * - Seamless switching between branch-based and worktree-based collaboration
 * - Backward compatibility with existing systems
 * - Enhanced parallel execution capabilities
 * - Automatic fallback mechanisms
 */

const { logger } = require('../logging/bumba-logger');
const { WorktreeCollaborationEnhancement } = require('./worktree-collaboration-enhancement');

// Import existing collaboration components
const { GitOrchestratedCollaboration } = require('./git-orchestrated-collaboration');
const { getInstance: getTerritoryManager } = require('../coordination/territory-manager');
const { getInstance: getFileLocking } = require('../coordination/file-locking-system');

/**
 * Enhanced Git Collaboration System with Worktree Support
 * Maintains full backward compatibility while adding physical isolation capabilities
 */
class EnhancedGitCollaboration extends GitOrchestratedCollaboration {
  constructor(config = {}) {
    super(config);
    
    // Worktree configuration
    this.worktreeConfig = {
      enabled: config.useWorktrees !== false,
      worktreesPath: config.worktreesPath,
      maxConcurrentAgents: config.maxConcurrentAgents || 10,
      useSharedDependencies: config.useSharedDependencies !== false,
      autoCleanup: config.autoCleanup !== false,
      workspaceTemplate: config.workspaceTemplate || 'default',
      fallbackToBranches: config.fallbackToBranches !== false,
      ...config.worktreeOptions
    };
    
    // Initialize worktree enhancement if enabled
    this.worktreeEnhancement = null;
    this.initializationPromise = null;
    
    if (this.worktreeConfig.enabled) {
      this.initializationPromise = this.initializeWorktreeEnhancement();
    }
    
    // Integration with existing systems
    this.territoryManager = getTerritoryManager();
    this.fileLocking = getFileLocking();
    
    // Enhanced metrics
    this.enhancedMetrics = {
      worktreeOperations: 0,
      branchOperations: 0,
      fallbackEvents: 0,
      parallelAgents: 0,
      maxParallelReached: 0
    };
    
    logger.info('🟢 Enhanced Git Collaboration initialized', {
      worktreesEnabled: this.worktreeConfig.enabled,
      maxAgents: this.worktreeConfig.maxConcurrentAgents
    });
  }

  /**
   * Initialize worktree enhancement system
   */
  async initializeWorktreeEnhancement() {
    try {
      logger.info('🟢 Initializing worktree enhancement system');
      
      this.worktreeEnhancement = new WorktreeCollaborationEnhancement(
        this.config.repository,
        this.worktreeConfig
      );
      
      // Set up event forwarding
      this.setupWorktreeEventForwarding();
      
      // Wait for worktree system to be ready
      await new Promise((resolve, reject) => {
        this.worktreeEnhancement.once('initialized', resolve);
        this.worktreeEnhancement.once('error', reject);
      });
      
      logger.info('🏁 Worktree enhancement system ready');
      
    } catch (error) {
      logger.error('Failed to initialize worktree enhancement:', error);
      
      if (this.worktreeConfig.fallbackToBranches) {
        logger.warn('🔄 Falling back to branch-based collaboration');
        this.worktreeConfig.enabled = false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Set up event forwarding from worktree system to main system
   */
  setupWorktreeEventForwarding() {
    const events = [
      'workspace-created',
      'workspace-cleaned',
      'work-committed',
      'work-merged',
      'command-executed',
      'command-failed',
      'conflict-resolved'
    ];
    
    events.forEach(event => {
      this.worktreeEnhancement.on(event, (data) => {
        this.emit(`worktree-${event}`, data);
        
        // Also emit on main collaboration events for compatibility
        switch (event) {
          case 'workspace-created':
            this.emit('agent-assigned', data);
            break;
          case 'work-committed':
            this.emit('work-committed', data);
            break;
          case 'work-merged':
            this.emit('work-merged', data);
            break;
        }
      });
    });
  }

  /**
   * Enhanced agent work assignment with worktree or branch isolation
   */
  async assignAgentWork(agentId, taskDescription, files = []) {
    // Ensure initialization is complete
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    const useWorktrees = this.shouldUseWorktrees(agentId, taskDescription, files);
    
    try {
      if (useWorktrees) {
        return await this.assignWorktreeWork(agentId, taskDescription, files);
      } else {
        return await this.assignBranchWork(agentId, taskDescription, files);
      }
    } catch (error) {
      // Fallback mechanism
      if (useWorktrees && this.worktreeConfig.fallbackToBranches) {
        logger.warn(`🔄 Worktree assignment failed for agent ${agentId}, falling back to branches`);
        this.enhancedMetrics.fallbackEvents++;
        return await this.assignBranchWork(agentId, taskDescription, files);
      }
      throw error;
    }
  }

  /**
   * Determine whether to use worktrees or branches for this assignment
   */
  shouldUseWorktrees(agentId, taskDescription, files) {
    // Use worktrees if:
    // 1. Worktrees are enabled
    // 2. System is healthy (not at capacity)
    // 3. Task involves multiple files or complex operations
    // 4. Not explicitly disabled for this agent
    
    if (!this.worktreeConfig.enabled || !this.worktreeEnhancement) {
      return false;
    }
    
    const health = this.worktreeEnhancement.isHealthy();
    if (!health.healthy) {
      logger.info(`🏁 Worktree capacity reached (${health.activeAgents}/${health.maxAgents}), using branches`);
      return false;
    }
    
    // Prefer worktrees for complex tasks
    const isComplexTask = files.length > 3 || 
                         taskDescription.toLowerCase().includes('build') ||
                         taskDescription.toLowerCase().includes('test') ||
                         taskDescription.toLowerCase().includes('deploy');
    
    return isComplexTask || this.agentBranches.size >= 3; // Use worktrees when 3+ agents active
  }

  /**
   * Assign work using worktree isolation
   */
  async assignWorktreeWork(agentId, taskDescription, files) {
    const branchName = this.generateBranchName(agentId, taskDescription);
    
    logger.info(`🟢 Assigning worktree-based work to agent ${agentId}`, {
      task: taskDescription,
      branch: branchName,
      files: files.length
    });
    
    try {
      // Create isolated workspace
      const workspace = await this.worktreeEnhancement.assignAgentWorkspace(
        agentId,
        { description: taskDescription, files },
        branchName
      );
      
      // Register in existing branch tracking system for compatibility
      this.agentBranches.set(agentId, {
        branch: branchName,
        task: taskDescription,
        files,
        workspace: workspace.path,
        workspaceId: workspace.id,
        mode: 'worktree',
        createdAt: new Date(),
        status: 'active',
        commits: []
      });
      
      // Register file ownership with territory manager
      for (const file of files) {
        this.registerFileOwnership(file, agentId, branchName);
        
        // Also register with territory manager for coordination
        try {
          await this.territoryManager.allocateTerritory(agentId, {
            type: 'file',
            path: file,
            mode: 'exclusive'
          });
        } catch (territoryError) {
          logger.warn(`Territory allocation warning for ${file}:`, territoryError.message);
        }
      }
      
      this.enhancedMetrics.worktreeOperations++;
      this.enhancedMetrics.parallelAgents = this.agentBranches.size;
      this.enhancedMetrics.maxParallelReached = Math.max(
        this.enhancedMetrics.maxParallelReached,
        this.enhancedMetrics.parallelAgents
      );
      
      this.emit('agent-assigned', {
        agentId,
        branch: branchName,
        workspace: workspace.path,
        task: taskDescription,
        mode: 'worktree'
      });
      
      return {
        success: true,
        mode: 'worktree',
        branch: branchName,
        workspace: workspace.path,
        port: workspace.port,
        message: `Agent ${agentId} assigned to isolated workspace with ${files.length} files`
      };
      
    } catch (error) {
      logger.error(`Failed to assign worktree work for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Assign work using traditional branch isolation
   */
  async assignBranchWork(agentId, taskDescription, files) {
    logger.info(`🟡 Assigning branch-based work to agent ${agentId}`, {
      task: taskDescription,
      files: files.length
    });
    
    this.enhancedMetrics.branchOperations++;
    
    // Use parent class implementation
    const result = await super.assignAgentWork(agentId, taskDescription, files);
    
    // Mark as branch mode
    const agentInfo = this.agentBranches.get(agentId);
    if (agentInfo) {
      agentInfo.mode = 'branch';
    }
    
    return {
      ...result,
      mode: 'branch'
    };
  }

  /**
   * Enhanced agent commit with workspace awareness
   */
  async agentCommit(agentId, message, files = []) {
    const agentInfo = this.agentBranches.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} not found or not assigned work`);
    }
    
    try {
      if (agentInfo.mode === 'worktree') {
        // Use worktree-specific commit
        logger.info(`💾 Committing worktree work for agent ${agentId}`);
        
        const commit = await this.worktreeEnhancement.commitAgentWork(agentId, message, files);
        
        // Update tracking
        agentInfo.commits.push({
          hash: commit.hash,
          message: commit.message,
          timestamp: commit.timestamp,
          files: commit.files
        });
        
        return {
          success: true,
          mode: 'worktree',
          commit: commit.hash,
          message,
          files: commit.files
        };
        
      } else {
        // Use traditional branch commit
        logger.info(`💾 Committing branch work for agent ${agentId}`);
        return await super.agentCommit(agentId, message, files);
      }
      
    } catch (error) {
      logger.error(`Failed to commit work for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced merge request with conflict resolution
   */
  async requestMerge(agentId, managerAgent = null, options = {}) {
    const agentInfo = this.agentBranches.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} not found or not assigned work`);
    }
    
    try {
      if (agentInfo.mode === 'worktree') {
        logger.info(`🔀 Processing worktree merge for agent ${agentId}`);
        
        const mergeResult = await this.worktreeEnhancement.mergeAgentWork(agentId, managerAgent);
        
        // Clean up workspace after successful merge
        if (mergeResult && !options.keepWorkspace) {
          await this.cleanupAgent(agentId);
        }
        
        return {
          success: true,
          mode: 'worktree',
          merged: true,
          branch: agentInfo.branch,
          mergedAt: mergeResult.mergedAt
        };
        
      } else {
        logger.info(`🔀 Processing branch merge for agent ${agentId}`);
        return await super.requestMerge(agentId, managerAgent);
      }
      
    } catch (error) {
      logger.error(`Failed to merge work for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Execute command in agent's workspace (worktree or branch context)
   */
  async executeAgentCommand(agentId, command, options = {}) {
    const agentInfo = this.agentBranches.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} not found or not assigned work`);
    }
    
    try {
      if (agentInfo.mode === 'worktree') {
        // Execute in isolated workspace
        return await this.worktreeEnhancement.executeInWorkspace(agentId, command, options);
      } else {
        // Execute in branch context (requires checkout)
        logger.info(`🏁 Executing command for agent ${agentId} in branch ${agentInfo.branch}`);
        
        // Acquire file locks to prevent conflicts
        const locks = [];
        try {
          for (const file of agentInfo.files) {
            const lock = await this.fileLocking.acquireLock(file, agentId, {
              timeout: options.timeout || 30000
            });
            if (lock) locks.push({ file, token: lock.token });
          }
          
          // Switch to agent's branch
          await execAsync(`git checkout ${agentInfo.branch}`, { cwd: this.config.repository });
          
          // Execute command
          const result = await execAsync(command, { cwd: this.config.repository, ...options });
          
          return result;
          
        } finally {
          // Release locks
          for (const lock of locks) {
            await this.fileLocking.releaseLock(lock.file, agentId, lock.token);
          }
        }
      }
      
    } catch (error) {
      logger.error(`Failed to execute command for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced agent cleanup with workspace cleanup
   */
  async cleanupAgent(agentId) {
    const agentInfo = this.agentBranches.get(agentId);
    
    try {
      if (agentInfo && agentInfo.mode === 'worktree') {
        logger.info(`🧹 Cleaning up worktree for agent ${agentId}`);
        
        // Clean up worktree workspace
        await this.worktreeEnhancement.cleanupWorkspace(agentId);
        
        // Release territory allocations
        try {
          await this.territoryManager.releaseAllTerritory(agentId);
        } catch (territoryError) {
          logger.warn(`Territory release warning for agent ${agentId}:`, territoryError.message);
        }
      }
      
      // Call parent cleanup if available
      if (super.cleanupAgent) {
        await super.cleanupAgent(agentId);
      } else {
        // Manual cleanup for branch-based collaboration
        if (agentInfo && agentInfo.mode === 'branch') {
          this.agentBranches.delete(agentId);
        }
      }
      
      this.enhancedMetrics.parallelAgents = this.agentBranches.size;
      
      logger.info(`🏁 Agent ${agentId} cleanup complete`);
      
    } catch (error) {
      logger.error(`Failed to cleanup agent ${agentId}:`, error);
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Get enhanced status including worktree information
   */
  getStatus() {
    const baseStatus = super.getStatus();
    
    const enhancedStatus = {
      ...baseStatus,
      worktreesEnabled: this.worktreeConfig.enabled,
      worktreeMetrics: this.worktreeEnhancement ? this.worktreeEnhancement.getMetrics() : null,
      enhancedMetrics: this.enhancedMetrics,
      agentModes: Array.from(this.agentBranches.entries()).map(([agentId, info]) => ({
        agentId,
        mode: info.mode || 'branch',
        workspace: info.workspace || null,
        uptime: Date.now() - info.createdAt.getTime()
      }))
    };
    
    return enhancedStatus;
  }

  /**
   * Force cleanup of all agents and workspaces
   */
  async emergencyCleanup() {
    logger.warn('🔴 Emergency cleanup initiated');
    
    const cleanupPromises = Array.from(this.agentBranches.keys()).map(agentId =>
      this.cleanupAgent(agentId).catch(error => 
        logger.error(`Emergency cleanup failed for agent ${agentId}:`, error)
      )
    );
    
    await Promise.allSettled(cleanupPromises);
    
    if (this.worktreeEnhancement) {
      await this.worktreeEnhancement.shutdownAll();
    }
    
    logger.warn('🔴 Emergency cleanup complete');
  }

  /**
   * Check system health for both branch and worktree modes
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    const worktreeHealth = this.worktreeEnhancement ? 
      this.worktreeEnhancement.isHealthy() : 
      { healthy: true, note: 'Worktrees disabled' };
    
    return {
      ...baseHealth,
      worktrees: worktreeHealth,
      enhancedMetrics: this.enhancedMetrics,
      overallHealth: baseHealth.healthy && worktreeHealth.healthy
    };
  }

  /**
   * Start a parallel demo with multiple agents
   */
  async startParallelDemo(agents = ['backend', 'frontend', 'test']) {
    logger.info('🟢 Starting parallel development demo', { agents });
    
    const tasks = {
      backend: {
        description: 'Implement REST API endpoints',
        files: ['src/api/routes.js', 'src/api/controllers.js', 'src/models/user.js']
      },
      frontend: {
        description: 'Create React components',
        files: ['src/components/Dashboard.jsx', 'src/components/UserProfile.jsx']
      },
      test: {
        description: 'Write comprehensive tests',
        files: ['tests/api.test.js', 'tests/components.test.js']
      }
    };
    
    const results = [];
    
    // Assign work to all agents in parallel
    const assignmentPromises = agents.map(async (agentId) => {
      try {
        const task = tasks[agentId] || {
          description: `Work on ${agentId} tasks`,
          files: [`src/${agentId}/index.js`]
        };
        
        const result = await this.assignAgentWork(agentId, task.description, task.files);
        results.push({ agentId, status: 'assigned', ...result });
        
        logger.info(`🏁 Agent ${agentId} assigned successfully`);
        
      } catch (error) {
        logger.error(`🔴 Failed to assign agent ${agentId}:`, error);
        results.push({ agentId, status: 'failed', error: error.message });
      }
    });
    
    await Promise.allSettled(assignmentPromises);
    
    const summary = {
      totalAgents: agents.length,
      successful: results.filter(r => r.status === 'assigned').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
      metrics: this.getStatus()
    };
    
    logger.info('🏁 Parallel demo assignment complete', summary);
    
    return summary;
  }
}

// Utility function to create enhanced collaboration instance
function createEnhancedCollaboration(config = {}) {
  return new EnhancedGitCollaboration(config);
}

module.exports = {
  EnhancedGitCollaboration,
  createEnhancedCollaboration
};