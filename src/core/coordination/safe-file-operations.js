/**
 * BUMBA Safe File Operations
 * MANDATORY wrapper for ALL file operations to prevent conflicts
 * 
 * CRITICAL: All agents MUST use these methods instead of direct fs operations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getFileLocking } = require('./file-locking-system');
const { getInstance: getTerritoryManager } = require('./territory-manager');

class SafeFileOperations {
  constructor() {
    this.fileLocking = getFileLocking();
    this.territoryManager = getTerritoryManager();
    
    // Track operations for rollback
    this.transactions = new Map();
    
    // Backup directory
    this.backupDir = '.bumba-backups';
    this.ensureBackupDir();
  }
  
  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      // Directory might exist
    }
  }
  
  /**
   * CRITICAL: Safe read operation
   * Checks if agent has permission to read
   */
  async safeRead(filepath, agentId) {
    const normalizedPath = path.normalize(filepath);
    
    // Check territory access
    if (!this.territoryManager.canAccess(agentId, normalizedPath, 'read')) {
      throw new Error(`Agent ${agentId} cannot read ${filepath} - owned by another agent`);
    }
    
    try {
      const content = await fs.readFile(normalizedPath, 'utf8');
      logger.info(`🟢 ${agentId} read ${filepath}`);
      return content;
    } catch (error) {
      logger.error(`🔴 Read failed for ${filepath}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * CRITICAL: Safe write operation with locking
   * This is THE method all agents must use for writes
   */
  async safeWrite(filepath, content, agentId, options = {}) {
    const normalizedPath = path.normalize(filepath);
    const { 
      createBackup = true,
      atomic = true,
      merge = false 
    } = options;
    
    // Step 1: Check territory access
    if (!this.territoryManager.canAccess(agentId, normalizedPath, 'write')) {
      logger.error(`🔴 ${agentId} cannot write to ${filepath} - owned by another agent`);
      
      // Try to negotiate
      const owner = this.territoryManager.fileOwnership.get(normalizedPath);
      const negotiation = await this.territoryManager.negotiateAccess(agentId, owner, normalizedPath);
      
      if (negotiation === 'wait') {
        logger.info(`⏳ ${agentId} waiting for ${filepath} to become available`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.safeWrite(filepath, content, agentId, options); // Retry
      }
      
      if (!negotiation) {
        throw new Error(`Cannot write to ${filepath} - owned by ${owner}`);
      }
    }
    
    // Step 2: Acquire file lock
    const lockToken = await this.fileLocking.acquireLock(normalizedPath, agentId, {
      wait: true,
      timeout: 30000
    });
    
    if (!lockToken) {
      throw new Error(`Failed to acquire lock for ${filepath}`);
    }
    
    try {
      // Step 3: Create backup if requested
      let backupPath = null;
      if (createBackup && await this.fileExists(normalizedPath)) {
        backupPath = await this.createBackup(normalizedPath, agentId);
      }
      
      // Step 4: Perform write operation
      if (atomic) {
        await this.atomicWrite(normalizedPath, content);
      } else {
        await fs.writeFile(normalizedPath, content, 'utf8');
      }
      
      logger.info(`🏁 ${agentId} wrote to ${filepath}`);
      
      // Step 5: Verify write
      const verification = await fs.readFile(normalizedPath, 'utf8');
      if (verification !== content) {
        throw new Error('Write verification failed');
      }
      
      return {
        success: true,
        filepath: normalizedPath,
        backup: backupPath,
        agent: agentId
      };
      
    } catch (error) {
      logger.error(`🔴 Write failed for ${filepath}: ${error.message}`);
      
      // Restore from backup if available
      if (backupPath) {
        await this.restoreBackup(backupPath, normalizedPath);
      }
      
      throw error;
      
    } finally {
      // Always release lock
      await this.fileLocking.releaseLock(normalizedPath, lockToken);
    }
  }
  
  /**
   * Atomic write operation
   * Writes to temp file then renames (atomic on most systems)
   */
  async atomicWrite(filepath, content) {
    const tempPath = `${filepath}.tmp.${crypto.randomBytes(8).toString('hex')}`;
    
    try {
      // Write to temp file
      await fs.writeFile(tempPath, content, 'utf8');
      
      // Atomic rename
      await fs.rename(tempPath, filepath);
      
    } catch (error) {
      // Clean up temp file if exists
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        // Ignore
      }
      throw error;
    }
  }
  
  /**
   * Create backup before write
   */
  async createBackup(filepath, agentId) {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    const backupName = path.basename(filepath) + `.${timestamp}.${hash}.backup`;
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      const content = await fs.readFile(filepath, 'utf8');
      await fs.writeFile(backupPath, content, 'utf8');
      
      // Store backup metadata
      const metaPath = backupPath + '.meta';
      await fs.writeFile(metaPath, JSON.stringify({
        original: filepath,
        agent: agentId,
        timestamp: new Date(timestamp).toISOString(),
        size: content.length
      }), 'utf8');
      
      logger.info(`🟢 Backup created: ${backupPath}`);
      return backupPath;
      
    } catch (error) {
      logger.error(`Backup failed: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Restore from backup
   */
  async restoreBackup(backupPath, targetPath) {
    try {
      const content = await fs.readFile(backupPath, 'utf8');
      await fs.writeFile(targetPath, content, 'utf8');
      logger.info(`🟢️ Restored from backup: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error(`Restore failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Safe append operation
   */
  async safeAppend(filepath, content, agentId) {
    const normalizedPath = path.normalize(filepath);
    
    // Read current content
    let current = '';
    if (await this.fileExists(normalizedPath)) {
      current = await this.safeRead(normalizedPath, agentId);
    }
    
    // Append and write
    const updated = current + content;
    return await this.safeWrite(normalizedPath, updated, agentId);
  }
  
  /**
   * Safe modification with callback
   */
  async safeModify(filepath, agentId, modifier) {
    const normalizedPath = path.normalize(filepath);
    
    // Read current content
    const current = await this.safeRead(normalizedPath, agentId);
    
    // Apply modification
    const modified = await modifier(current);
    
    // Write back
    return await this.safeWrite(normalizedPath, modified, agentId);
  }
  
  /**
   * Transaction support for multiple operations
   */
  async beginTransaction(transactionId, agentId) {
    const transaction = {
      id: transactionId,
      agent: agentId,
      operations: [],
      backups: [],
      startTime: Date.now()
    };
    
    this.transactions.set(transactionId, transaction);
    logger.info(`🟢 Transaction ${transactionId} started by ${agentId}`);
    
    return transactionId;
  }
  
  /**
   * Add operation to transaction
   */
  async addToTransaction(transactionId, operation) {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    transaction.operations.push(operation);
  }
  
  /**
   * Commit transaction
   */
  async commitTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    logger.info(`🏁 Committing transaction ${transactionId}`);
    
    try {
      // Execute all operations
      for (const op of transaction.operations) {
        if (op.type === 'write') {
          await this.safeWrite(op.filepath, op.content, transaction.agent, {
            createBackup: true
          });
        } else if (op.type === 'delete') {
          await this.safeDelete(op.filepath, transaction.agent);
        }
      }
      
      this.transactions.delete(transactionId);
      logger.info(`🏁 Transaction ${transactionId} committed successfully`);
      
      return true;
      
    } catch (error) {
      // Rollback on failure
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }
  
  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      return false;
    }
    
    logger.warn(`⏪ Rolling back transaction ${transactionId}`);
    
    // Restore all backups in reverse order
    for (let i = transaction.backups.length - 1; i >= 0; i--) {
      const backup = transaction.backups[i];
      await this.restoreBackup(backup.path, backup.original);
    }
    
    this.transactions.delete(transactionId);
    
    return true;
  }
  
  /**
   * Safe delete operation
   */
  async safeDelete(filepath, agentId) {
    const normalizedPath = path.normalize(filepath);
    
    // Check access
    if (!this.territoryManager.canAccess(agentId, normalizedPath, 'write')) {
      throw new Error(`Agent ${agentId} cannot delete ${filepath}`);
    }
    
    // Acquire lock
    const lockToken = await this.fileLocking.acquireLock(normalizedPath, agentId);
    
    if (!lockToken) {
      throw new Error(`Failed to acquire lock for ${filepath}`);
    }
    
    try {
      // Create backup before delete
      const backupPath = await this.createBackup(normalizedPath, agentId);
      
      // Delete file
      await fs.unlink(normalizedPath);
      
      logger.info(`🟢️ ${agentId} deleted ${filepath} (backup: ${backupPath})`);
      
      return {
        success: true,
        backup: backupPath
      };
      
    } finally {
      await this.fileLocking.releaseLock(normalizedPath, lockToken);
    }
  }
  
  /**
   * Check if file exists
   */
  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get safe file operations stats
   */
  getStats() {
    return {
      activeLocks: this.fileLocking.getStats(),
      territories: this.territoryManager.getTerritoryMap(),
      activeTransactions: this.transactions.size
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  SafeFileOperations,
  getInstance: () => {
    if (!instance) {
      instance = new SafeFileOperations();
    }
    return instance;
  }
};