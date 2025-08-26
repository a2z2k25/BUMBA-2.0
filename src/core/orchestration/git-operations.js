/**
 * Git Operations Layer
 * Provides actual git command execution for Git-Aware Orchestration
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);

class GitOperations {
  constructor(config = {}) {
    this.repoPath = config.repository || process.cwd();
    this.mainBranch = config.mainBranch || 'main';
    this.debug = config.debug || false;
  }

  /**
   * Execute a git command
   */
  async executeGitCommand(command, options = {}) {
    const fullCommand = `git ${command}`;
    
    if (this.debug) {
      console.log(`Executing: ${fullCommand}`);
    }

    try {
      const { stdout, stderr } = await execPromise(fullCommand, {
        cwd: options.cwd || this.repoPath,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr && this.debug) {
        console.warn(`Git stderr: ${stderr}`);
      }

      return { success: true, output: stdout.trim(), error: null };
    } catch (error) {
      return { 
        success: false, 
        output: null, 
        error: error.message,
        stderr: error.stderr 
      };
    }
  }

  // ========== BRANCH OPERATIONS ==========

  /**
   * Get current branch
   */
  async getCurrentBranch() {
    const result = await this.executeGitCommand('branch --show-current');
    return result.success ? result.output : null;
  }

  /**
   * List all branches
   */
  async listBranches(options = {}) {
    const flags = options.remote ? '-r' : options.all ? '-a' : '';
    const result = await this.executeGitCommand(`branch ${flags}`);
    
    if (result.success) {
      return result.output
        .split('\n')
        .map(branch => branch.trim().replace('* ', ''))
        .filter(branch => branch);
    }
    
    return [];
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName, fromBranch = null) {
    const base = fromBranch || this.mainBranch;
    
    // Ensure we have latest base branch
    await this.executeGitCommand(`fetch origin ${base}`);
    
    // Create and checkout new branch
    const result = await this.executeGitCommand(`checkout -b ${branchName} origin/${base}`);
    
    return {
      success: result.success,
      branch: branchName,
      base: base,
      error: result.error
    };
  }

  /**
   * Switch to branch
   */
  async checkoutBranch(branchName) {
    const result = await this.executeGitCommand(`checkout ${branchName}`);
    return result.success;
  }

  /**
   * Delete branch
   */
  async deleteBranch(branchName, force = false) {
    const flag = force ? '-D' : '-d';
    const result = await this.executeGitCommand(`branch ${flag} ${branchName}`);
    return result.success;
  }

  /**
   * Push branch to remote
   */
  async pushBranch(branchName, setUpstream = true) {
    const flags = setUpstream ? '-u origin' : '';
    const result = await this.executeGitCommand(`push ${flags} ${branchName}`);
    return result.success;
  }

  // ========== COMMIT OPERATIONS ==========

  /**
   * Stage files
   */
  async stageFiles(files = []) {
    const filePaths = files.length > 0 ? files.join(' ') : '.';
    const result = await this.executeGitCommand(`add ${filePaths}`);
    return result.success;
  }

  /**
   * Create commit
   */
  async commit(message, options = {}) {
    let command = 'commit';
    
    if (options.amend) {
      command += ' --amend';
    }
    
    if (options.noVerify) {
      command += ' --no-verify';
    }
    
    // Escape message for shell
    const escapedMessage = message.replace(/"/g, '\\"');
    command += ` -m "${escapedMessage}"`;
    
    const result = await this.executeGitCommand(command);
    
    if (result.success) {
      // Get commit hash
      const hashResult = await this.executeGitCommand('rev-parse HEAD');
      return {
        success: true,
        hash: hashResult.output,
        message: message
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Get commit history
   */
  async getCommitHistory(options = {}) {
    const limit = options.limit || 10;
    const format = options.format || '%H|%an|%ae|%at|%s';
    
    const result = await this.executeGitCommand(
      `log --format="${format}" -n ${limit}`
    );
    
    if (result.success) {
      return result.output.split('\n').map(line => {
        const [hash, author, email, timestamp, subject] = line.split('|');
        return {
          hash,
          author,
          email,
          timestamp: new Date(parseInt(timestamp) * 1000),
          subject
        };
      });
    }
    
    return [];
  }

  // ========== MERGE OPERATIONS ==========

  /**
   * Merge branch
   */
  async mergeBranch(sourceBranch, options = {}) {
    let command = `merge ${sourceBranch}`;
    
    if (options.strategy) {
      command += ` --strategy=${options.strategy}`;
    }
    
    if (options.noFastForward) {
      command += ' --no-ff';
    }
    
    if (options.squash) {
      command += ' --squash';
    }
    
    const result = await this.executeGitCommand(command);
    
    return {
      success: result.success,
      conflicts: result.error && result.error.includes('conflict'),
      error: result.error
    };
  }

  /**
   * Rebase branch
   */
  async rebaseBranch(ontoBranch) {
    const result = await this.executeGitCommand(`rebase ${ontoBranch}`);
    
    return {
      success: result.success,
      conflicts: result.error && result.error.includes('conflict'),
      error: result.error
    };
  }

  /**
   * Abort merge
   */
  async abortMerge() {
    const result = await this.executeGitCommand('merge --abort');
    return result.success;
  }

  // ========== DIFF OPERATIONS ==========

  /**
   * Get files changed between branches
   */
  async getChangedFiles(branch1, branch2 = null) {
    const target = branch2 || this.mainBranch;
    const result = await this.executeGitCommand(`diff --name-only ${target}...${branch1}`);
    
    if (result.success) {
      return result.output.split('\n').filter(file => file);
    }
    
    return [];
  }

  /**
   * Get detailed diff
   */
  async getDiff(branch1, branch2 = null, options = {}) {
    const target = branch2 || this.mainBranch;
    let command = `diff ${target}...${branch1}`;
    
    if (options.stat) {
      command += ' --stat';
    }
    
    if (options.nameOnly) {
      command += ' --name-only';
    }
    
    const result = await this.executeGitCommand(command);
    return result.success ? result.output : null;
  }

  /**
   * Check for conflicts between branches
   */
  async checkForConflicts(branch1, branch2) {
    // Create a temporary branch to test merge
    const testBranch = `test-merge-${Date.now()}`;
    const currentBranch = await this.getCurrentBranch();
    
    try {
      // Checkout branch2 as base
      await this.checkoutBranch(branch2);
      
      // Create test branch
      await this.executeGitCommand(`checkout -b ${testBranch}`);
      
      // Try to merge branch1
      const mergeResult = await this.executeGitCommand(`merge --no-commit --no-ff ${branch1}`);
      
      // Check for conflicts
      const statusResult = await this.executeGitCommand('status --porcelain');
      const conflicts = statusResult.output
        .split('\n')
        .filter(line => line.startsWith('UU '))
        .map(line => line.substring(3));
      
      // Cleanup
      await this.executeGitCommand('merge --abort');
      await this.checkoutBranch(currentBranch);
      await this.deleteBranch(testBranch, true);
      
      return {
        hasConflicts: conflicts.length > 0,
        conflictingFiles: conflicts
      };
      
    } catch (error) {
      // Cleanup on error
      await this.checkoutBranch(currentBranch);
      await this.deleteBranch(testBranch, true);
      
      return {
        hasConflicts: false,
        conflictingFiles: [],
        error: error.message
      };
    }
  }

  // ========== STASH OPERATIONS ==========

  /**
   * Stash changes
   */
  async stashChanges(message = '') {
    const command = message ? `stash push -m "${message}"` : 'stash';
    const result = await this.executeGitCommand(command);
    return result.success;
  }

  /**
   * Pop stash
   */
  async stashPop() {
    const result = await this.executeGitCommand('stash pop');
    return result.success;
  }

  // ========== TAG OPERATIONS ==========

  /**
   * Create tag
   */
  async createTag(tagName, message = '') {
    const command = message 
      ? `tag -a ${tagName} -m "${message}"`
      : `tag ${tagName}`;
    
    const result = await this.executeGitCommand(command);
    return result.success;
  }

  /**
   * Push tag
   */
  async pushTag(tagName) {
    const result = await this.executeGitCommand(`push origin ${tagName}`);
    return result.success;
  }

  /**
   * List tags
   */
  async listTags() {
    const result = await this.executeGitCommand('tag');
    
    if (result.success) {
      return result.output.split('\n').filter(tag => tag);
    }
    
    return [];
  }

  // ========== STATUS OPERATIONS ==========

  /**
   * Get repository status
   */
  async getStatus() {
    const result = await this.executeGitCommand('status --porcelain');
    
    if (result.success) {
      const files = result.output.split('\n').filter(line => line);
      
      return {
        modified: files.filter(f => f.startsWith(' M')).map(f => f.substring(3)),
        added: files.filter(f => f.startsWith('A ')).map(f => f.substring(3)),
        deleted: files.filter(f => f.startsWith(' D')).map(f => f.substring(3)),
        untracked: files.filter(f => f.startsWith('??')).map(f => f.substring(3)),
        conflicted: files.filter(f => f.startsWith('UU')).map(f => f.substring(3))
      };
    }
    
    return null;
  }

  /**
   * Check if working directory is clean
   */
  async isClean() {
    const result = await this.executeGitCommand('status --porcelain');
    return result.success && result.output === '';
  }

  // ========== REMOTE OPERATIONS ==========

  /**
   * Fetch from remote
   */
  async fetch(branch = null) {
    const command = branch ? `fetch origin ${branch}` : 'fetch --all';
    const result = await this.executeGitCommand(command);
    return result.success;
  }

  /**
   * Pull changes
   */
  async pull(branch = null) {
    const command = branch ? `pull origin ${branch}` : 'pull';
    const result = await this.executeGitCommand(command);
    
    return {
      success: result.success,
      conflicts: result.error && result.error.includes('conflict'),
      error: result.error
    };
  }

  /**
   * Get remote URL
   */
  async getRemoteUrl(remote = 'origin') {
    const result = await this.executeGitCommand(`remote get-url ${remote}`);
    return result.success ? result.output : null;
  }

  // ========== ANALYSIS OPERATIONS ==========

  /**
   * Analyze file overlap between branches
   */
  async analyzeFileOverlap(branch1, branch2) {
    const files1 = await this.getChangedFiles(branch1);
    const files2 = await this.getChangedFiles(branch2);
    
    const set1 = new Set(files1);
    const set2 = new Set(files2);
    
    const intersection = [...set1].filter(f => set2.has(f));
    const union = new Set([...set1, ...set2]);
    
    return {
      overlap: union.size > 0 ? intersection.length / union.size : 0,
      conflictingFiles: intersection,
      totalFiles: union.size
    };
  }

  /**
   * Get branch statistics
   */
  async getBranchStats(branch) {
    // Get commits ahead/behind main
    const aheadBehind = await this.executeGitCommand(
      `rev-list --left-right --count ${this.mainBranch}...${branch}`
    );
    
    if (aheadBehind.success) {
      const [behind, ahead] = aheadBehind.output.split('\t').map(n => parseInt(n));
      
      // Get last commit info
      const lastCommit = await this.executeGitCommand(
        `log -1 --format="%H|%an|%at|%s" ${branch}`
      );
      
      let commitInfo = null;
      if (lastCommit.success) {
        const [hash, author, timestamp, subject] = lastCommit.output.split('|');
        commitInfo = {
          hash,
          author,
          timestamp: new Date(parseInt(timestamp) * 1000),
          subject
        };
      }
      
      return {
        ahead,
        behind,
        lastCommit: commitInfo
      };
    }
    
    return null;
  }

  /**
   * Get file change statistics
   */
  async getFileStats(branch1, branch2 = null) {
    const target = branch2 || this.mainBranch;
    const result = await this.executeGitCommand(`diff --stat ${target}...${branch1}`);
    
    if (result.success) {
      const lines = result.output.split('\n');
      const summary = lines[lines.length - 1];
      
      const match = summary.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
      
      if (match) {
        return {
          filesChanged: parseInt(match[1]) || 0,
          insertions: parseInt(match[2]) || 0,
          deletions: parseInt(match[3]) || 0
        };
      }
    }
    
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }

  // ========== CLEANUP OPERATIONS ==========

  /**
   * Clean up merged branches
   */
  async cleanupMergedBranches(options = {}) {
    const dryRun = options.dryRun || false;
    
    // Get merged branches
    const result = await this.executeGitCommand('branch --merged');
    
    if (result.success) {
      const branches = result.output
        .split('\n')
        .map(b => b.trim().replace('* ', ''))
        .filter(b => b && b !== this.mainBranch && b !== 'main' && b !== 'master');
      
      if (dryRun) {
        return { branches, deleted: false };
      }
      
      // Delete each merged branch
      for (const branch of branches) {
        await this.deleteBranch(branch);
      }
      
      return { branches, deleted: true };
    }
    
    return { branches: [], deleted: false };
  }

  /**
   * Clean up stale branches
   */
  async cleanupStaleBranches(daysOld = 30, options = {}) {
    const dryRun = options.dryRun || false;
    const staleBranches = [];
    
    const branches = await this.listBranches();
    
    for (const branch of branches) {
      if (branch === this.mainBranch || branch === 'main' || branch === 'master') {
        continue;
      }
      
      const stats = await this.getBranchStats(branch);
      
      if (stats && stats.lastCommit) {
        const daysSinceCommit = (Date.now() - stats.lastCommit.timestamp) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCommit > daysOld) {
          staleBranches.push({
            branch,
            daysSinceCommit: Math.floor(daysSinceCommit),
            lastCommit: stats.lastCommit
          });
          
          if (!dryRun) {
            await this.deleteBranch(branch, true);
          }
        }
      }
    }
    
    return {
      staleBranches,
      deleted: !dryRun
    };
  }
}

module.exports = GitOperations;