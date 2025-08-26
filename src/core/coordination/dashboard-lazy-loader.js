/**
 * Dashboard Lazy Loader
 * Delays loading of heavy blessed/blessed-contrib until actually needed
 * Saves ~8MB of memory at startup
 */

class LazyDashboard {
  constructor() {
    this._actualDashboard = null;
    this._initPromise = null;
    this.isLazy = true;
  }

  /**
   * Get stats without loading the actual dashboard
   */
  getStats() {
    if (!this._actualDashboard) {
      return {
        status: 'lazy',
        message: 'Dashboard not loaded (saving ~8MB memory)',
        memoryStatus: 'optimized'
      };
    }
    return this._actualDashboard.getStats();
  }

  /**
   * Check if dashboard is needed
   */
  isNeeded() {
    // Dashboard only needed for interactive/development modes
    return process.env.NODE_ENV === 'development' || 
           process.env.BUMBA_INTERACTIVE === 'true';
  }

  /**
   * Lazy load the actual dashboard
   */
  async _loadDashboard() {
    if (this._actualDashboard) {
      return this._actualDashboard;
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = (async () => {
      const { getInstance } = require('./coordination-dashboard');
      this._actualDashboard = getInstance();
      return this._actualDashboard;
    })();

    return this._initPromise;
  }

  /**
   * Proxy all method calls to the actual dashboard
   */
  async initialize(...args) {
    if (!this.isNeeded()) {
      return this; // Don't load if not needed
    }
    const dashboard = await this._loadDashboard();
    return dashboard.initialize(...args);
  }

  async start(...args) {
    if (!this.isNeeded()) {
      return { status: 'skipped', reason: 'Not in interactive mode' };
    }
    const dashboard = await this._loadDashboard();
    return dashboard.start(...args);
  }

  async stop(...args) {
    if (!this._actualDashboard) {
      return { status: 'not-running' };
    }
    return this._actualDashboard.stop(...args);
  }

  async update(...args) {
    if (!this._actualDashboard) {
      return; // Silently ignore updates if not loaded
    }
    return this._actualDashboard.update(...args);
  }
}

// Singleton instance
let lazyInstance = null;

/**
 * Get lazy dashboard instance
 */
function getInstance() {
  if (!lazyInstance) {
    lazyInstance = new LazyDashboard();
  }
  return lazyInstance;
}

module.exports = { 
  LazyDashboard,
  getInstance 
};