/**
 * BUMBA Git-Orchestrated Multi-Agent Collaboration System
 * Enables multiple agents to work on the same codebase using Git branching strategies
 * Integrates with GitHub MCP server for repository management
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const GitOperations = require('../orchestration/git-operations');

/**
 * Git-Orchestrated Collaboration System
 * Prevents agents from overwriting each other's work through intelligent branching
 */
class GitOrchestratedCollaboration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      repository: config.repository || process.cwd(),
      mainBranch: config.mainBranch || 'main',
      githubToken: config.githubToken || process.env.GITHUB_TOKEN,
      requireReview: config.requireReview !== false,
      autoMerge: config.autoMerge || false,
      conflictStrategy: config.conflictStrategy || 'manager_review',
      ...config
    };
    
    // Track active agent branches
    this.agentBranches = new Map();
    
    // File ownership registry
    this.fileOwnership = new Map();
    
    // Merge queue for coordination
    this.mergeQueue = [];
    
    // Lock registry for critical operations
    this.fileLocks = new Map();
    
    // Branch protection rules
    this.branchProtection = {
      requireCodeReview: true,
      requireConsciousnessCheck: true,
      requireManagerApproval: true,
      requireTests: true,
      minimumReviewers: 1
    };
    
    // Initialize GitHub MCP connection
    this.githubMCP = null;
    
    // Initialize Git Operations layer for actual git commands
    this.gitOps = new GitOperations({
      repository: this.config.repository,
      mainBranch: this.config.mainBranch,
      debug: this.config.debug
    });
    
    this.initializeGitHub();
  }
  
  /**
   * Initialize GitHub MCP server connection
   */
  async initializeGitHub() {
    try {
      // In production, this would connect to the GitHub MCP server
      logger.info('🟢 Initializing GitHub MCP connection with Git Operations layer...');
      
      // Verify git is available using GitOperations
      const versionResult = await this.gitOps.executeGitCommand('--version');
      if (versionResult.success) {
        logger.info(`🏁 Git available: ${versionResult.output}`);
      }
      
      // Check current branch
      this.currentBranch = await this.gitOps.getCurrentBranch();
      
      // Ensure we're on main branch initially
      if (this.currentBranch !== this.config.mainBranch) {
        await this.gitOps.checkoutBranch(this.config.mainBranch);
        this.currentBranch = this.config.mainBranch;
      }
      
      this.emit('initialized', { branch: this.config.mainBranch });
      
    } catch (error) {
      logger.error('Failed to initialize GitHub integration:', error);
      throw error;
    }
  }
  
  /**
   * Assign an agent to work on specific tasks with isolated branch
   */
  async assignAgentWork(agentId, taskDescription, files = []) {
    const branchName = this.generateBranchName(agentId, taskDescription);
    
    try {
      logger.info(`🟢 Creating branch ${branchName} for agent ${agentId}`);
      
      // Create and checkout new branch from main using GitOperations
      const branchResult = await this.gitOps.createBranch(branchName, this.config.mainBranch);
      
      if (!branchResult.success) {
        throw new Error(`Failed to create branch: ${branchResult.error}`);
      }
      
      // Register branch ownership
      this.agentBranches.set(agentId, {
        branch: branchName,
        task: taskDescription,
        files,
        createdAt: new Date(),
        status: 'active',
        commits: []
      });
      
      // Register file ownership if specific files assigned
      for (const file of files) {
        this.registerFileOwnership(file, agentId, branchName);
      }
      
      this.emit('branch-created', {
        agentId,
        branch: branchName,
        task: taskDescription
      });
      
      return {
        success: true,
        branch: branchName,
        message: `Agent ${agentId} assigned to branch ${branchName}`
      };
      
    } catch (error) {
      logger.error(`Failed to create branch for agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Register file ownership to prevent conflicts
   */
  registerFileOwnership(filePath, agentId, branch) {
    const existingOwner = this.fileOwnership.get(filePath);
    
    if (existingOwner && existingOwner.agentId !== agentId) {
      logger.warn(`🟡 File ${filePath} already owned by ${existingOwner.agentId}`);
      
      // Add to collaboration request queue
      if (!existingOwner.collaborators) {
        existingOwner.collaborators = [];
      }
      existingOwner.collaborators.push({
        agentId,
        branch,
        requestedAt: new Date()
      });
      
    } else {
      this.fileOwnership.set(filePath, {
        agentId,
        branch,
        lockedAt: new Date(),
        collaborators: []
      });
    }
  }
  
  /**
   * Agent commits their work with validation
   */
  async agentCommit(agentId, message, files = []) {
    const agentInfo = this.agentBranches.get(agentId);
    
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} has no active branch`);
    }
    
    try {
      // Stage files using GitOperations
      const stageSuccess = await this.gitOps.stageFiles(files.length > 0 ? files : []);
      
      if (!stageSuccess) {
        throw new Error('Failed to stage files');
      }
      
      // Create commit with agent attribution
      const fullMessage = `[${agentId}] ${message}\n\nAgent: ${agentId}\nTask: ${agentInfo.task}`;
      const commitResult = await this.gitOps.commit(fullMessage);
      
      if (!commitResult.success) {
        throw new Error(`Commit failed: ${commitResult.error}`);
      }
      
      // Track commit
      agentInfo.commits.push({
        hash: commitResult.hash,
        message,
        timestamp: new Date(),
        files
      });
      
      logger.info(`🏁 Agent ${agentId} committed: ${message}`);
      
      this.emit('agent-commit', {
        agentId,
        branch: agentInfo.branch,
        message,
        files,
        hash: commitResult.hash
      });
      
      return { success: true, message: 'Commit successful', hash: commitResult.hash };
      
    } catch (error) {
      logger.error(`Commit failed for agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Request merge to main branch with manager review
   */
  async requestMerge(agentId, managerAgent = null) {
    const agentInfo = this.agentBranches.get(agentId);
    
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} has no active branch`);
    }
    
    try {
      // Push branch to remote using GitOperations
      if (this.config.githubToken) {
        const pushSuccess = await this.gitOps.pushBranch(agentInfo.branch);
        if (!pushSuccess) {
          logger.warn('Failed to push branch to remote, continuing with local merge');
        }
      }
      
      // Create merge request
      const mergeRequest = {
        id: `mr-${Date.now()}`,
        agentId,
        branch: agentInfo.branch,
        targetBranch: this.config.mainBranch,
        task: agentInfo.task,
        commits: agentInfo.commits,
        requestedAt: new Date(),
        status: 'pending_review',
        reviewer: managerAgent,
        conflicts: []
      };
      
      // Check for conflicts
      const conflicts = await this.detectConflicts(agentInfo.branch);
      mergeRequest.conflicts = conflicts;
      
      if (conflicts.length > 0) {
        mergeRequest.status = 'conflicts_detected';
        logger.warn(`🟡 Conflicts detected in ${agentInfo.branch}`);
        
        // Trigger conflict resolution
        await this.resolveConflicts(mergeRequest, managerAgent);
      }
      
      // Add to merge queue
      this.mergeQueue.push(mergeRequest);
      
      // Request manager review if specified
      if (managerAgent && this.config.requireReview) {
        await this.requestManagerReview(mergeRequest, managerAgent);
      }
      
      this.emit('merge-requested', mergeRequest);
      
      return mergeRequest;
      
    } catch (error) {
      logger.error(`Merge request failed for agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Detect merge conflicts with main branch
   */
  async detectConflicts(branch) {
    try {
      // Use GitOperations to check for conflicts
      const conflictCheck = await this.gitOps.checkForConflicts(branch, this.config.mainBranch);
      
      return conflictCheck.conflictingFiles || [];
      
    } catch (error) {
      logger.error(`Failed to detect conflicts for branch ${branch}:`, error);
      return [];
    }
  }
  
  /**
   * Resolve conflicts with manager intervention
   */
  async resolveConflicts(mergeRequest, managerAgent) {
    logger.info(`🟢 Initiating conflict resolution for ${mergeRequest.branch}`);
    
    const resolution = {
      mergeRequestId: mergeRequest.id,
      conflicts: mergeRequest.conflicts,
      strategy: this.config.conflictStrategy,
      resolutions: []
    };
    
    for (const conflictFile of mergeRequest.conflicts) {
      // Get file ownership information
      const ownership = this.fileOwnership.get(conflictFile);
      
      if (this.config.conflictStrategy === 'manager_review') {
        // Manager makes decision
        resolution.resolutions.push({
          file: conflictFile,
          decision: 'pending_manager',
          manager: managerAgent,
          originalOwner: ownership?.agentId,
          conflictingAgent: mergeRequest.agentId
        });
        
      } else if (this.config.conflictStrategy === 'consciousness_driven') {
        // Use consciousness principles to resolve
        resolution.resolutions.push({
          file: conflictFile,
          decision: 'consciousness_evaluation',
          criteria: ['purpose_alignment', 'technical_quality', 'design_integrity']
        });
        
      } else if (this.config.conflictStrategy === 'auto_merge') {
        // Attempt automatic resolution
        resolution.resolutions.push({
          file: conflictFile,
          decision: 'auto_merge_latest',
          warning: 'May lose changes'
        });
      }
    }
    
    this.emit('conflict-resolution', resolution);
    
    return resolution;
  }
  
  /**
   * Manager reviews and approves merge
   */
  async managerReview(mergeRequestId, managerAgent, decision, feedback = '') {
    const mergeRequest = this.mergeQueue.find(mr => mr.id === mergeRequestId);
    
    if (!mergeRequest) {
      throw new Error(`Merge request ${mergeRequestId} not found`);
    }
    
    const review = {
      mergeRequestId,
      reviewer: managerAgent,
      decision, // 'approved', 'rejected', 'changes_requested'
      feedback,
      timestamp: new Date()
    };
    
    mergeRequest.review = review;
    
    if (decision === 'approved') {
      mergeRequest.status = 'approved';
      
      // Proceed with merge
      if (this.config.autoMerge) {
        await this.executeMerge(mergeRequest);
      }
      
    } else if (decision === 'rejected') {
      mergeRequest.status = 'rejected';
      
      // Clean up branch
      await this.cleanupBranch(mergeRequest.agentId);
      
    } else if (decision === 'changes_requested') {
      mergeRequest.status = 'changes_requested';
      
      // Notify agent of required changes
      this.emit('changes-requested', {
        agentId: mergeRequest.agentId,
        feedback: review.feedback
      });
    }
    
    this.emit('review-completed', review);
    
    return review;
  }
  
  /**
   * Execute the actual merge to main branch
   */
  async executeMerge(mergeRequest) {
    try {
      logger.info(`🟢 Merging ${mergeRequest.branch} to ${this.config.mainBranch}`);
      
      // Checkout main branch using GitOperations
      const checkoutSuccess = await this.gitOps.checkoutBranch(this.config.mainBranch);
      if (!checkoutSuccess) {
        throw new Error('Failed to checkout main branch');
      }
      
      // Merge the agent's branch using GitOperations
      const mergeMessage = `Merge ${mergeRequest.branch}: ${mergeRequest.task}\n\nApproved by: ${mergeRequest.review?.reviewer || 'system'}`;
      const mergeResult = await this.gitOps.mergeBranch(mergeRequest.branch, {
        noFastForward: true
      });
      
      if (!mergeResult.success) {
        if (mergeResult.conflicts) {
          throw new Error(`Merge conflicts detected: ${mergeResult.error}`);
        }
        throw new Error(`Merge failed: ${mergeResult.error}`);
      }
      
      // Create merge commit with proper message
      await this.gitOps.commit(mergeMessage, { amend: true });
      
      // Push to remote if configured
      if (this.config.githubToken) {
        const pushSuccess = await this.gitOps.pushBranch(this.config.mainBranch);
        if (!pushSuccess) {
          logger.warn('Failed to push to remote, changes remain local');
        }
      }
      
      // Update merge request status
      mergeRequest.status = 'merged';
      mergeRequest.mergedAt = new Date();
      
      // Clean up branch
      await this.cleanupBranch(mergeRequest.agentId);
      
      // Release file ownership
      this.releaseFileOwnership(mergeRequest.agentId);
      
      logger.info(`🏁 Successfully merged ${mergeRequest.branch}`);
      
      this.emit('merge-completed', mergeRequest);
      
      return { success: true, message: 'Merge successful' };
      
    } catch (error) {
      logger.error(`Merge failed for ${mergeRequest.branch}:`, error);
      mergeRequest.status = 'merge_failed';
      throw error;
    }
  }
  
  /**
   * Clean up agent branch after merge or rejection
   */
  async cleanupBranch(agentId) {
    const agentInfo = this.agentBranches.get(agentId);
    
    if (!agentInfo) {
      return;
    }
    
    try {
      // Delete local branch using GitOperations
      const deleteSuccess = await this.gitOps.deleteBranch(agentInfo.branch);
      
      if (!deleteSuccess) {
        // Try force delete if normal delete fails
        await this.gitOps.deleteBranch(agentInfo.branch, true);
      }
      
      // Delete remote branch if exists
      if (this.config.githubToken) {
        const remoteDeleteCmd = await this.gitOps.executeGitCommand(
          `push origin --delete ${agentInfo.branch}`
        );
        if (!remoteDeleteCmd.success) {
          // Ignore if remote branch doesn't exist
          logger.debug(`Remote branch ${agentInfo.branch} may not exist`);
        }
      }
      }
      
      // Remove from registry
      this.agentBranches.delete(agentId);
      
      logger.info(`🟢 Cleaned up branch ${agentInfo.branch}`);
      
    } catch (error) {
      logger.warn(`Failed to cleanup branch ${agentInfo.branch}:`, error);
    }
  }
  
  /**
   * Release file ownership after merge
   */
  releaseFileOwnership(agentId) {
    for (const [file, ownership] of this.fileOwnership.entries()) {
      if (ownership.agentId === agentId) {
        // Check if there are waiting collaborators
        if (ownership.collaborators && ownership.collaborators.length > 0) {
          // Transfer ownership to next collaborator
          const nextOwner = ownership.collaborators.shift();
          this.fileOwnership.set(file, {
            agentId: nextOwner.agentId,
            branch: nextOwner.branch,
            lockedAt: new Date(),
            collaborators: ownership.collaborators
          });
          
          logger.info(`🟢 Transferred ownership of ${file} to ${nextOwner.agentId}`);
        } else {
          // No waiting collaborators, release ownership
          this.fileOwnership.delete(file);
        }
      }
    }
  }
  
  /**
   * Request manager review through GitHub PR or internal system
   */
  async requestManagerReview(mergeRequest, managerAgent) {
    // In production, this would create a GitHub PR via MCP
    // For now, we'll simulate the review request
    
    const reviewRequest = {
      id: `review-${Date.now()}`,
      mergeRequestId: mergeRequest.id,
      reviewer: managerAgent,
      branch: mergeRequest.branch,
      changes: await this.getBranchChanges(mergeRequest.branch),
      requestedAt: new Date(),
      status: 'pending'
    };
    
    this.emit('review-requested', reviewRequest);
    
    return reviewRequest;
  }
  
  /**
   * Get changes in branch compared to main
   */
  async getBranchChanges(branch) {
    try {
      const { stdout } = await execAsync(
        `git diff ${this.config.mainBranch}...${branch} --stat`
      );
      
      return stdout.split('\n').filter(line => line.trim());
      
    } catch (error) {
      logger.error(`Failed to get changes for ${branch}:`, error);
      return [];
    }
  }
  
  /**
   * Generate branch name from agent ID and task
   */
  generateBranchName(agentId, task) {
    const sanitizedTask = task
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .substring(0, 30);
    
    return `agent/${agentId}/${sanitizedTask}-${Date.now()}`;
  }
  
  /**
   * Get current collaboration status
   */
  getStatus() {
    return {
      activeBranches: Array.from(this.agentBranches.entries()).map(([agentId, info]) => ({
        agentId,
        branch: info.branch,
        task: info.task,
        status: info.status,
        commits: info.commits.length
      })),
      fileOwnership: Array.from(this.fileOwnership.entries()).map(([file, ownership]) => ({
        file,
        owner: ownership.agentId,
        branch: ownership.branch,
        waitingCollaborators: ownership.collaborators?.length || 0
      })),
      pendingMerges: this.mergeQueue.filter(mr => mr.status === 'pending_review').length,
      conflicts: this.mergeQueue.filter(mr => mr.status === 'conflicts_detected').length
    };
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  GitOrchestratedCollaboration,
  getInstance: (config) => {
    if (!instance) {
      instance = new GitOrchestratedCollaboration(config);
    }
    return instance;
  }
};