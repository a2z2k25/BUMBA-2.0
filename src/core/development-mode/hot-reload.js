/**
 * BUMBA Development Mode - Sprint 1: Hot Reload System
 * 
 * Live code reloading without restart, with state preservation
 * and selective module replacement
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const Module = require('module');

/**
 * Hot Reload System for Development Mode
 * Provides instant code updates without losing state
 */
class HotReloadSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Watch settings
      watchPaths: config.watchPaths || ['./src'],
      ignorePaths: config.ignorePaths || ['node_modules', '.git', 'dist', 'build'],
      extensions: config.extensions || ['.js', '.json', '.ts'],
      
      // Reload settings
      debounceDelay: config.debounceDelay || 100, // ms
      batchReload: config.batchReload !== false,
      preserveState: config.preserveState !== false,
      
      // Safety settings
      maxReloadAttempts: config.maxReloadAttempts || 3,
      errorRecovery: config.errorRecovery !== false,
      safeMode: config.safeMode || false,
      
      // Performance
      cacheModules: config.cacheModules !== false,
      lazyLoad: config.lazyLoad || false
    };
    
    // State management
    this.state = {
      active: false,
      reloading: false,
      reloadCount: 0,
      lastReload: null,
      preservedState: new Map(),
      moduleCache: new Map(),
      dependencyGraph: new Map()
    };
    
    // File watcher
    this.watcher = null;
    
    // Reload queue
    this.reloadQueue = new Set();
    this.reloadTimer = null;
    
    // Error tracking
    this.errorCount = 0;
    this.lastError = null;
    
    // Module tracking
    this.originalRequire = Module.prototype.require;
    this.trackedModules = new Map();
  }

  /**
   * Start hot reload system
   */
  start() {
    if (this.state.active) {
      console.log('🟠️ Hot reload already active');
      return;
    }
    
    this.state.active = true;
    console.log('🔥 Hot Reload System: Starting...');
    
    // Setup file watcher
    this.setupWatcher();
    
    // Hook into require system
    this.hookRequireSystem();
    
    // Build initial dependency graph
    this.buildDependencyGraph();
    
    console.log('🏁 Hot Reload System: Active');
    console.log(`📁 Watching: ${this.config.watchPaths.join(', ')}`);
    
    this.emit('started');
  }

  /**
   * Stop hot reload system
   */
  stop() {
    if (!this.state.active) return;
    
    this.state.active = false;
    
    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    // Restore original require
    Module.prototype.require = this.originalRequire;
    
    // Clear timers
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    
    console.log('🔴 Hot Reload System: Stopped');
    this.emit('stopped');
  }

  /**
   * Setup file watcher
   */
  setupWatcher() {
    this.watcher = chokidar.watch(this.config.watchPaths, {
      ignored: this.config.ignorePaths,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });
    
    // File change event
    this.watcher.on('change', (filePath) => {
      if (this.shouldReload(filePath)) {
        this.queueReload(filePath, 'change');
      }
    });
    
    // File add event
    this.watcher.on('add', (filePath) => {
      if (this.shouldReload(filePath)) {
        this.queueReload(filePath, 'add');
      }
    });
    
    // File remove event
    this.watcher.on('unlink', (filePath) => {
      this.handleFileRemoval(filePath);
    });
    
    // Error event
    this.watcher.on('error', (error) => {
      console.error('🔥 Watcher error:', error);
      this.handleError(error);
    });
  }

  /**
   * Check if file should trigger reload
   */
  shouldReload(filePath) {
    const ext = path.extname(filePath);
    return this.config.extensions.includes(ext);
  }

  /**
   * Queue file for reload
   */
  queueReload(filePath, changeType) {
    const absolutePath = path.resolve(filePath);
    
    this.reloadQueue.add(absolutePath);
    
    console.log(`🔄 Change detected: ${path.basename(filePath)} (${changeType})`);
    
    // Debounce reloads
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    
    this.reloadTimer = setTimeout(() => {
      this.processReloadQueue();
    }, this.config.debounceDelay);
  }

  /**
   * Process reload queue
   */
  async processReloadQueue() {
    if (this.state.reloading || this.reloadQueue.size === 0) return;
    
    this.state.reloading = true;
    const startTime = Date.now();
    
    const files = Array.from(this.reloadQueue);
    this.reloadQueue.clear();
    
    console.log(`\n🔥 Hot Reloading ${files.length} file(s)...`);
    
    try {
      // Save state if enabled
      if (this.config.preserveState) {
        await this.saveState();
      }
      
      // Reload modules
      const reloaded = await this.reloadModules(files);
      
      // Restore state if enabled
      if (this.config.preserveState) {
        await this.restoreState();
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`🏁 Hot Reload complete in ${duration}ms`);
      console.log(`   • Modules reloaded: ${reloaded.length}`);
      console.log(`   • State preserved: ${this.config.preserveState ? 'Yes' : 'No'}`);
      
      this.state.reloadCount++;
      this.state.lastReload = Date.now();
      
      this.emit('reload-complete', {
        files,
        duration,
        reloaded,
        statePreserved: this.config.preserveState
      });
      
      // Reset error count on successful reload
      this.errorCount = 0;
      
    } catch (error) {
      console.error('🔴 Hot Reload failed:', error.message);
      this.handleReloadError(error, files);
    } finally {
      this.state.reloading = false;
    }
  }

  /**
   * Reload modules
   */
  async reloadModules(files) {
    const reloaded = [];
    
    for (const file of files) {
      try {
        // Find affected modules
        const affected = this.findAffectedModules(file);
        
        // Clear module cache
        for (const modulePath of affected) {
          this.clearModuleCache(modulePath);
          reloaded.push(modulePath);
        }
        
        // Reload the module
        if (require.cache[file]) {
          delete require.cache[file];
          
          // Re-require if it's tracked
          if (this.trackedModules.has(file)) {
            const moduleInfo = this.trackedModules.get(file);
            this.reloadModule(file, moduleInfo);
          }
        }
        
      } catch (error) {
        console.error(`🔴 Failed to reload ${path.basename(file)}:`, error.message);
        
        if (!this.config.errorRecovery) {
          throw error;
        }
      }
    }
    
    return reloaded;
  }

  /**
   * Find modules affected by file change
   */
  findAffectedModules(filePath) {
    const affected = new Set([filePath]);
    
    // Find all modules that depend on this file
    this.dependencyGraph.forEach((deps, modulePath) => {
      if (deps.has(filePath)) {
        affected.add(modulePath);
      }
    });
    
    return Array.from(affected);
  }

  /**
   * Clear module from cache
   */
  clearModuleCache(modulePath) {
    if (require.cache[modulePath]) {
      // Store module exports for state preservation
      if (this.config.preserveState) {
        const moduleExports = require.cache[modulePath].exports;
        this.preserveModuleState(modulePath, moduleExports);
      }
      
      delete require.cache[modulePath];
    }
  }

  /**
   * Reload a specific module
   */
  reloadModule(modulePath, moduleInfo) {
    try {
      // Special handling for different module types
      if (moduleInfo.type === 'class') {
        this.reloadClass(modulePath, moduleInfo);
      } else if (moduleInfo.type === 'function') {
        this.reloadFunction(modulePath, moduleInfo);
      } else {
        // Standard reload
        require(modulePath);
      }
    } catch (error) {
      console.error(`Failed to reload module ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Reload class module with instance preservation
   */
  reloadClass(modulePath, moduleInfo) {
    const NewClass = require(modulePath);
    
    // Preserve instances if possible
    if (moduleInfo.instances) {
      moduleInfo.instances.forEach(instance => {
        // Copy prototype methods
        Object.setPrototypeOf(instance, NewClass.prototype);
      });
    }
  }

  /**
   * Reload function module
   */
  reloadFunction(modulePath, moduleInfo) {
    const newFunction = require(modulePath);
    
    // Update references if tracked
    if (moduleInfo.references) {
      moduleInfo.references.forEach(ref => {
        ref.fn = newFunction;
      });
    }
  }

  /**
   * Hook into require system
   */
  hookRequireSystem() {
    const self = this;
    
    Module.prototype.require = function(id) {
      const result = self.originalRequire.apply(this, arguments);
      
      // Track module dependencies
      if (self.state.active) {
        const resolvedPath = Module._resolveFilename(id, this);
        self.trackDependency(this.filename, resolvedPath);
      }
      
      return result;
    };
  }

  /**
   * Track module dependency
   */
  trackDependency(from, to) {
    if (!this.dependencyGraph) {
      this.dependencyGraph = new Map();
    }
    
    if (!this.dependencyGraph.has(from)) {
      this.dependencyGraph.set(from, new Set());
    }
    
    this.dependencyGraph.get(from).add(to);
  }

  /**
   * Build initial dependency graph
   */
  buildDependencyGraph() {
    // Analyze loaded modules
    Object.keys(require.cache).forEach(modulePath => {
      const module = require.cache[modulePath];
      
      if (module.children) {
        module.children.forEach(child => {
          this.trackDependency(modulePath, child.filename);
        });
      }
    });
    
    console.log(`📊 Dependency graph built: ${this.dependencyGraph.size} modules`);
  }

  /**
   * Save current state
   */
  async saveState() {
    const stateData = {
      timestamp: Date.now(),
      modules: {},
      global: {}
    };
    
    // Save module states
    this.trackedModules.forEach((info, modulePath) => {
      if (info.getState) {
        stateData.modules[modulePath] = info.getState();
      }
    });
    
    // Save global state if provided
    if (global.__BUMBA_STATE__) {
      stateData.global = global.__BUMBA_STATE__;
    }
    
    this.state.preservedState.set('latest', stateData);
    
    this.emit('state-saved', stateData);
  }

  /**
   * Restore saved state
   */
  async restoreState() {
    const stateData = this.state.preservedState.get('latest');
    if (!stateData) return;
    
    // Restore module states
    Object.entries(stateData.modules).forEach(([modulePath, state]) => {
      if (this.trackedModules.has(modulePath)) {
        const info = this.trackedModules.get(modulePath);
        if (info.setState) {
          info.setState(state);
        }
      }
    });
    
    // Restore global state
    if (stateData.global) {
      global.__BUMBA_STATE__ = stateData.global;
    }
    
    this.emit('state-restored', stateData);
  }

  /**
   * Preserve module state
   */
  preserveModuleState(modulePath, moduleExports) {
    // Store serializable state
    if (moduleExports && typeof moduleExports === 'object') {
      try {
        const state = {};
        
        // Extract state from common patterns
        if (moduleExports.getState) {
          state.custom = moduleExports.getState();
        }
        
        // Store class instances
        if (moduleExports.constructor && moduleExports.constructor.name !== 'Object') {
          state.className = moduleExports.constructor.name;
          state.instance = this.serializeInstance(moduleExports);
        }
        
        this.state.preservedState.set(modulePath, state);
      } catch (error) {
        // State preservation failed, continue without it
        console.warn(`Could not preserve state for ${modulePath}`);
      }
    }
  }

  /**
   * Serialize instance for preservation
   */
  serializeInstance(instance) {
    const serialized = {};
    
    // Get own properties
    Object.keys(instance).forEach(key => {
      const value = instance[key];
      
      // Only serialize simple types
      if (typeof value !== 'function' && typeof value !== 'object') {
        serialized[key] = value;
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        // Serialize plain objects
        try {
          serialized[key] = JSON.parse(JSON.stringify(value));
        } catch (e) {
          // Skip non-serializable
        }
      }
    });
    
    return serialized;
  }

  /**
   * Handle file removal
   */
  handleFileRemoval(filePath) {
    const absolutePath = path.resolve(filePath);
    
    console.log(`🗑️ File removed: ${path.basename(filePath)}`);
    
    // Remove from cache
    if (require.cache[absolutePath]) {
      delete require.cache[absolutePath];
    }
    
    // Remove from dependency graph
    this.dependencyGraph.delete(absolutePath);
    
    // Remove dependencies to this file
    this.dependencyGraph.forEach(deps => {
      deps.delete(absolutePath);
    });
    
    // Remove from tracked modules
    this.trackedModules.delete(absolutePath);
    
    this.emit('file-removed', absolutePath);
  }

  /**
   * Handle reload error
   */
  handleReloadError(error, files) {
    this.errorCount++;
    this.lastError = error;
    
    if (this.errorCount >= this.config.maxReloadAttempts) {
      console.error('🔴 Maximum reload attempts reached. Entering safe mode.');
      this.enterSafeMode();
    } else {
      console.log(`🟠️ Retry attempt ${this.errorCount}/${this.config.maxReloadAttempts}`);
      
      // Retry with delay
      setTimeout(() => {
        files.forEach(file => this.reloadQueue.add(file));
        this.processReloadQueue();
      }, 1000 * this.errorCount);
    }
    
    this.emit('reload-error', {
      error,
      files,
      attempt: this.errorCount
    });
  }

  /**
   * Enter safe mode
   */
  enterSafeMode() {
    this.config.safeMode = true;
    console.log('🟡️ Safe mode activated - Manual reload required');
    
    // Stop automatic reloading
    if (this.watcher) {
      this.watcher.close();
    }
    
    this.emit('safe-mode-activated');
  }

  /**
   * Handle general error
   */
  handleError(error) {
    console.error('Hot Reload Error:', error);
    this.emit('error', error);
  }

  /**
   * Register module for tracking
   */
  registerModule(modulePath, info = {}) {
    this.trackedModules.set(modulePath, {
      path: modulePath,
      type: info.type || 'generic',
      getState: info.getState || null,
      setState: info.setState || null,
      instances: info.instances || [],
      references: info.references || []
    });
  }

  /**
   * Get reload statistics
   */
  getStats() {
    return {
      active: this.state.active,
      reloadCount: this.state.reloadCount,
      lastReload: this.state.lastReload,
      trackedModules: this.trackedModules ? this.trackedModules.size : 0,
      dependencyGraph: this.dependencyGraph ? this.dependencyGraph.size : 0,
      preservedStates: this.state.preservedState ? this.state.preservedState.size : 0,
      errorCount: this.errorCount,
      safeMode: this.config.safeMode
    };
  }

  /**
   * Clear all state
   */
  clearState() {
    this.state.preservedState.clear();
    this.errorCount = 0;
    this.lastError = null;
    console.log('🧹 State cleared');
  }
}

module.exports = HotReloadSystem;