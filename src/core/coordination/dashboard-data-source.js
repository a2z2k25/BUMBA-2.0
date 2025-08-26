/**
 * BUMBA Dashboard Data Source
 * Provides data for dashboard components without circular dependencies
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getFileLocking } = require('./file-locking-system');
const { getInstance: getTerritoryManager } = require('./territory-manager');
const { getInstance: getSafeFileOps } = require('./safe-file-operations');
const { getInstance: getAgentIdentity } = require('./agent-identity');

class DashboardDataSource extends EventEmitter {
  constructor() {
    super();
    
    this.fileLocking = getFileLocking();
    this.territoryManager = getTerritoryManager();
    this.safeFileOps = getSafeFileOps();
    this.agentIdentity = getAgentIdentity();
    
    this.lastSnapshot = null;
  }
  
  /**
   * Get current coordination status
   */
  async getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      agents: this.getAgentStatus(),
      locks: this.getLockStatus(),
      territories: this.getTerritoryStatus(),
      conflicts: this.getConflictStatus(),
      performance: this.getPerformanceMetrics()
    };
    
    this.lastSnapshot = status;
    return status;
  }
  
  /**
   * Get agent status
   */
  getAgentStatus() {
    const agents = this.agentIdentity.getActiveAgents();
    const stats = this.agentIdentity.getStats();
    
    return {
      total: stats.totalAgents,
      active: stats.activeAgents,
      inactive: stats.inactiveAgents,
      byDepartment: stats.byDepartment,
      byType: stats.byType,
      activeList: agents
    };
  }
  
  /**
   * Get lock status
   */
  getLockStatus() {
    const locks = this.fileLocking.getLocks();
    const waitQueue = this.fileLocking.getWaitQueue();
    
    return {
      activeLocks: locks.size,
      waitingAgents: waitQueue.size,
      locks: Array.from(locks.entries()).map(([file, lock]) => ({
        file,
        agent: lock.agentId,
        acquired: lock.acquiredAt,
        type: lock.type
      })),
      queue: Array.from(waitQueue.entries()).map(([file, agents]) => ({
        file,
        waiting: agents.length
      }))
    };
  }
  
  /**
   * Get territory status
   */
  getTerritoryStatus() {
    const territories = this.territoryManager.getAllTerritories();
    const conflicts = this.territoryManager.getConflicts();
    
    return {
      totalTerritories: territories.length,
      activeConflicts: conflicts.length,
      territories: territories.map(t => ({
        path: t.path,
        owner: t.owner,
        claimed: t.claimedAt,
        exclusive: t.exclusive
      })),
      conflicts: conflicts
    };
  }
  
  /**
   * Get conflict status
   */
  getConflictStatus() {
    const operations = this.safeFileOps.getOperationHistory();
    const conflicts = operations.filter(op => op.conflictDetected);
    
    return {
      totalOperations: operations.length,
      totalConflicts: conflicts.length,
      recentConflicts: conflicts.slice(-10),
      resolutionRate: operations.length > 0 
        ? ((operations.length - conflicts.length) / operations.length) * 100
        : 100
    };
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const operations = this.safeFileOps.getOperationHistory();
    const avgTime = operations.length > 0
      ? operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length
      : 0;
    
    return {
      avgOperationTime: avgTime,
      successRate: this.calculateSuccessRate(operations),
      throughput: this.calculateThroughput(operations),
      lockContention: this.calculateLockContention()
    };
  }
  
  /**
   * Calculate success rate
   */
  calculateSuccessRate(operations) {
    if (operations.length === 0) return 100;
    const successful = operations.filter(op => op.success).length;
    return (successful / operations.length) * 100;
  }
  
  /**
   * Calculate throughput
   */
  calculateThroughput(operations) {
    const recentOps = operations.filter(op => {
      const age = Date.now() - new Date(op.timestamp).getTime();
      return age < 60000; // Last minute
    });
    return recentOps.length;
  }
  
  /**
   * Calculate lock contention
   */
  calculateLockContention() {
    const locks = this.fileLocking.getLocks();
    const waitQueue = this.fileLocking.getWaitQueue();
    
    if (locks.size === 0) return 0;
    
    let totalWaiting = 0;
    waitQueue.forEach(agents => {
      totalWaiting += agents.length;
    });
    
    return (totalWaiting / locks.size) * 100;
  }
  
  /**
   * Get safety report
   */
  async getSafetyReport() {
    const status = await this.getStatus();
    
    return {
      timestamp: status.timestamp,
      safe: status.conflicts.totalConflicts === 0,
      warnings: [],
      recommendations: [],
      metrics: {
        conflictRate: 100 - status.conflicts.resolutionRate,
        lockContention: status.performance.lockContention,
        successRate: status.performance.successRate
      }
    };
  }
  
  /**
   * Refresh data
   */
  async refresh() {
    const status = await this.getStatus();
    this.emit('refresh', status);
    return status;
  }
}

// Singleton
let instance = null;

module.exports = {
  DashboardDataSource,
  getInstance: () => {
    if (!instance) {
      instance = new DashboardDataSource();
    }
    return instance;
  }
};