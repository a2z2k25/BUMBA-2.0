/**
 * BUMBA Coordination Systems - Central Import Hub
 * 
 * Provides standardized access to all coordination systems with
 * consistent singleton patterns and dependency injection.
 */

// Import coordination systems
const { getInstance: getFileLocking } = require('./file-locking-system');
const { getInstance: getTerritoryManager } = require('./territory-manager');
const { getInstance: getSafeFileOps } = require('./safe-file-operations');
const { getInstance: getAgentIdentity } = require('./agent-identity');

// Use lazy loading for dashboard to save ~8MB memory
const USE_LAZY_DASHBOARD = process.env.DISABLE_LAZY_DASHBOARD !== 'true';
const { getInstance: getDashboard } = USE_LAZY_DASHBOARD 
  ? require('./dashboard-lazy-loader')
  : require('./coordination-dashboard');

/**
 * Coordination Systems Hub
 * Provides centralized access to all coordination systems
 */
class CoordinationHub {
  constructor() {
    this._systems = new Map();
    this._initialized = false;
  }

  /**
   * Initialize all coordination systems
   */
  async initialize() {
    if (this._initialized) {return;}

    // Initialize systems in dependency order
    this._systems.set('agentIdentity', getAgentIdentity());
    this._systems.set('fileLocking', getFileLocking());
    this._systems.set('territoryManager', getTerritoryManager());
    this._systems.set('safeFileOps', getSafeFileOps());
    this._systems.set('dashboard', getDashboard());

    this._initialized = true;
  }

  /**
   * Get all coordination systems
   */
  getAllSystems() {
    if (!this._initialized) {
      throw new Error('CoordinationHub must be initialized before use');
    }
    return {
      fileLocking: this._systems.get('fileLocking'),
      territoryManager: this._systems.get('territoryManager'),
      safeFileOps: this._systems.get('safeFileOps'),
      agentIdentity: this._systems.get('agentIdentity'),
      dashboard: this._systems.get('dashboard')
    };
  }

  /**
   * Get specific coordination system
   */
  getSystem(systemName) {
    if (!this._initialized) {
      throw new Error('CoordinationHub must be initialized before use');
    }
    return this._systems.get(systemName);
  }

  /**
   * Check if all systems are healthy
   */
  async healthCheck() {
    const systems = this.getAllSystems();
    const health = {};

    for (const [name, system] of Object.entries(systems)) {
      try {
        if (system && typeof system.getStats === 'function') {
          health[name] = { status: 'healthy', stats: system.getStats() };
        } else {
          health[name] = { status: 'healthy', message: 'No stats available' };
        }
      } catch (error) {
        health[name] = { status: 'unhealthy', error: error.message };
      }
    }

    return health;
  }
  
  /**
   * Coordinate between departments
   */
  async coordinateDepartments(initiator, departments, task) {
    const coordination = {
      id: `coord-${Date.now()}`,
      initiator: initiator.name || initiator,
      departments,
      task,
      timestamp: new Date().toISOString(),
      status: 'in-progress'
    };
    
    // Store coordination
    this._activeCoordinations = this._activeCoordinations || new Map();
    this._activeCoordinations.set(coordination.id, coordination);
    
    // Execute coordination
    const results = [];
    for (const dept of departments) {
      try {
        const result = {
          department: dept,
          status: 'notified',
          timestamp: new Date().toISOString()
        };
        results.push(result);
      } catch (error) {
        results.push({
          department: dept,
          status: 'error',
          error: error.message
        });
      }
    }
    
    coordination.results = results;
    coordination.status = 'completed';
    
    return coordination;
  }
  
  /**
   * Handle handoff between departments
   */
  async handleHandoff(fromDept, toDept, payload) {
    const handoff = {
      id: `handoff-${Date.now()}`,
      from: fromDept.name || fromDept,
      to: toDept.name || toDept,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Use territory manager for safe handoff
    const territoryManager = this._systems.get('territoryManager');
    if (territoryManager) {
      // Register handoff in territory
      await territoryManager.registerOperation(handoff.from, 'handoff', {
        to: handoff.to,
        payload: handoff.payload
      });
    }
    
    // Complete handoff
    handoff.status = 'completed';
    handoff.completedAt = new Date().toISOString();
    
    return handoff;
  }
  
  /**
   * Resolve conflicts between departments
   */
  async resolveConflict(conflict) {
    const resolution = {
      id: `resolution-${Date.now()}`,
      conflict,
      timestamp: new Date().toISOString(),
      status: 'analyzing'
    };
    
    // Simple conflict resolution strategy
    if (conflict.type === 'resource') {
      resolution.strategy = 'time-sharing';
      resolution.decision = 'Departments will share resource with time slots';
    } else if (conflict.type === 'priority') {
      resolution.strategy = 'priority-based';
      resolution.decision = 'Higher priority department gets precedence';
    } else {
      resolution.strategy = 'negotiation';
      resolution.decision = 'Departments must negotiate directly';
    }
    
    resolution.status = 'resolved';
    resolution.resolvedAt = new Date().toISOString();
    
    return resolution;
  }
}

// Singleton instance
let hubInstance = null;

/**
 * Get the coordination hub singleton
 */
function getCoordinationHub() {
  if (!hubInstance) {
    hubInstance = new CoordinationHub();
  }
  return hubInstance;
}

// Export both individual systems and the hub
module.exports = {
  // Individual system access (for backward compatibility)
  getFileLocking,
  getTerritoryManager,
  getSafeFileOps,
  getAgentIdentity,
  getDashboard,

  // Centralized hub access (recommended)
  getCoordinationHub,
  CoordinationHub
};