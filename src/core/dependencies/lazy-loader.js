/**
 * Lazy Loading System
 * Deferred module loading for performance optimization
 * Sprint 19-20 - Architecture Fix  
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { moduleLoader } = require('./module-loader');
const { ComponentTimers } = require('../timers/timer-registry');

class LazyLoader {
  constructor() {
    // Lazy loading configuration
    this.config = {
      specialists: true,      // Lazy load specialists
      departments: true,      // Lazy load departments
      integrations: true,     // Lazy load integrations
      heavyModules: true,     // Lazy load heavy modules
      threshold: 100000,      // Size threshold in bytes
      preloadCritical: true,  // Preload critical modules
      warmupOnIdle: true      // Warm up cache when idle
    };
    
    // Tracking
    this.lazyModules = new Map();
    this.loadedModules = new Set();
    this.criticalModules = new Set();
    this.deferredModules = new Map();
    
    // Timers
    this.timers = new ComponentTimers('lazy-loader');
    
    // Statistics
    this.stats = {
      lazyRegistered: 0,
      lazyLoaded: 0,
      preloaded: 0,
      bytesDeferred: 0,
      loadTimesSaved: 0
    };
    
    // Register state
    stateManager.register('lazyLoader', {
      stats: this.stats,
      lazyModules: [],
      loadedModules: []
    });
    
    // Define critical modules that should preload
    this.defineCriticalModules();
    
    // Start idle warmup if configured
    if (this.config.warmupOnIdle) {
      this.scheduleIdleWarmup();
    }
  }
  
  /**
   * Define critical modules for preloading
   */
  defineCriticalModules() {
    // Core systems that should always be loaded
    this.criticalModules.add('core/error-boundaries/error-boundary');
    this.criticalModules.add('core/security/input-validator');
    this.criticalModules.add('core/security/rate-limiter');
    this.criticalModules.add('core/auth/jwt-manager');
    this.criticalModules.add('core/logging/bumba-logger');
  }
  
  /**
   * Register module for lazy loading
   */
  registerLazy(modulePath, options = {}) {
    const config = {
      preload: options.preload || false,
      priority: options.priority || 'normal', // critical, high, normal, low
      dependencies: options.dependencies || [],
      condition: options.condition || null,    // Function to determine if should load
      timeout: options.timeout || 30000,
      fallback: options.fallback || null
    };
    
    this.lazyModules.set(modulePath, config);
    this.stats.lazyRegistered++;
    
    // Check if should preload
    if (config.preload || config.priority === 'critical') {
      this.preloadModule(modulePath);
    }
    
    // Create lazy proxy
    return this.createLazyProxy(modulePath, config);
  }
  
  /**
   * Create lazy loading proxy
   */
  createLazyProxy(modulePath, config) {
    let module = null;
    let loading = false;
    let error = null;
    
    const proxy = new Proxy({}, {
      get: (target, prop) => {
        // Special properties
        if (prop === '__isLazyProxy') return true;
        if (prop === '__modulePath') return modulePath;
        if (prop === '__isLoaded') return module !== null;
        if (prop === '__loadError') return error;
        
        // Load module if not loaded
        if (!module && !loading && !error) {
          loading = true;
          
          // Check condition
          if (config.condition && !config.condition()) {
            loading = false;
            return config.fallback ? config.fallback[prop] : undefined;
          }
          
          // Load module
          this.loadModule(modulePath, config)
            .then(loaded => {
              module = loaded;
              loading = false;
              this.stats.lazyLoaded++;
            })
            .catch(err => {
              error = err;
              loading = false;
              logger.error(`Failed to lazy load ${modulePath}:`, err);
              
              // Use fallback if available
              if (config.fallback) {
                module = config.fallback;
              }
            });
        }
        
        // Return property from loaded module
        return module ? module[prop] : undefined;
      },
      
      has: (target, prop) => {
        if (!module && !loading) {
          // Trigger load
          proxy[prop];
        }
        return module ? prop in module : false;
      },
      
      ownKeys: (target) => {
        if (!module && !loading) {
          // Trigger load
          proxy.toString;
        }
        return module ? Object.keys(module) : [];
      }
    });
    
    return proxy;
  }
  
  /**
   * Load module
   */
  async loadModule(modulePath, config) {
    const startTime = Date.now();
    
    try {
      // Load with timeout
      const loadPromise = moduleLoader.loadModule(modulePath, { lazy: false });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Load timeout')), config.timeout)
      );
      
      const module = await Promise.race([loadPromise, timeoutPromise]);
      
      // Track loaded module
      this.loadedModules.add(modulePath);
      
      // Update stats
      const loadTime = Date.now() - startTime;
      this.stats.loadTimesSaved += loadTime;
      
      logger.debug(`Lazy loaded ${modulePath} in ${loadTime}ms`);
      
      // Load dependencies
      if (config.dependencies.length > 0) {
        await this.loadDependencies(config.dependencies);
      }
      
      this.updateState();
      
      return module;
      
    } catch (error) {
      logger.error(`Failed to load module ${modulePath}:`, error);
      
      // Try fallback
      if (config.fallback) {
        return config.fallback;
      }
      
      throw error;
    }
  }
  
  /**
   * Load dependencies
   */
  async loadDependencies(dependencies) {
    const promises = dependencies.map(dep => {
      if (this.lazyModules.has(dep)) {
        return this.loadModule(dep, this.lazyModules.get(dep));
      }
      return moduleLoader.loadModule(dep);
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Preload module
   */
  async preloadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) {
      return;
    }
    
    try {
      const config = this.lazyModules.get(modulePath) || {};
      await this.loadModule(modulePath, config);
      this.stats.preloaded++;
      
      logger.debug(`Preloaded module: ${modulePath}`);
      
    } catch (error) {
      logger.error(`Failed to preload ${modulePath}:`, error);
    }
  }
  
  /**
   * Defer heavy module loading
   */
  deferModule(modulePath, sizeBytes) {
    this.deferredModules.set(modulePath, {
      size: sizeBytes,
      deferredAt: Date.now()
    });
    
    this.stats.bytesDeferred += sizeBytes;
    
    // Register for lazy loading
    return this.registerLazy(modulePath, {
      priority: 'low',
      preload: false
    });
  }
  
  /**
   * Schedule idle warmup
   */
  scheduleIdleWarmup() {
    // Wait for idle time
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.warmupCache(), { timeout: 5000 });
    } else {
      // Fallback for Node.js
      this.timers.setTimeout('warmup', () => this.warmupCache(), 5000);
    }
  }
  
  /**
   * Warm up cache by preloading low priority modules
   */
  async warmupCache() {
    const lowPriorityModules = [];
    
    for (const [modulePath, config] of this.lazyModules) {
      if (!this.loadedModules.has(modulePath) && config.priority === 'low') {
        lowPriorityModules.push(modulePath);
      }
    }
    
    // Load in batches to avoid blocking
    const batchSize = 5;
    for (let i = 0; i < lowPriorityModules.length; i += batchSize) {
      const batch = lowPriorityModules.slice(i, i + batchSize);
      
      await Promise.all(batch.map(path => 
        this.preloadModule(path).catch(() => {})
      ));
      
      // Pause between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logger.info(`Cache warmup complete: ${lowPriorityModules.length} modules`);
  }
  
  /**
   * Create lazy specialist loader
   */
  createSpecialistLoader() {
    const specialistPaths = [
      'core/specialists/technical',
      'core/specialists/experience',
      'core/specialists/strategic',
      'core/specialists/documentation'
    ];
    
    const specialists = {};
    
    for (const basePath of specialistPaths) {
      const category = path.basename(basePath);
      specialists[category] = new Proxy({}, {
        get: (target, specialistName) => {
          const modulePath = `${basePath}/${specialistName}`;
          
          if (!this.lazyModules.has(modulePath)) {
            this.registerLazy(modulePath, {
              priority: 'normal',
              preload: false
            });
          }
          
          return this.lazyModules.get(modulePath);
        }
      });
    }
    
    return specialists;
  }
  
  /**
   * Create lazy department loader
   */
  createDepartmentLoader() {
    const departments = {};
    const departmentPath = 'core/departments';
    
    return new Proxy(departments, {
      get: (target, departmentName) => {
        const modulePath = `${departmentPath}/${departmentName}-manager`;
        
        if (!this.lazyModules.has(modulePath)) {
          this.registerLazy(modulePath, {
            priority: 'high',
            preload: false,
            dependencies: [`${departmentPath}/${departmentName}-orchestrator`]
          });
        }
        
        return this.lazyModules.get(modulePath);
      }
    });
  }
  
  /**
   * Analyze module for lazy loading potential
   */
  analyzeModule(modulePath) {
    const stats = fs.statSync(modulePath);
    const sizeBytes = stats.size;
    
    const analysis = {
      path: modulePath,
      size: sizeBytes,
      shouldLazyLoad: false,
      reason: ''
    };
    
    // Check size threshold
    if (sizeBytes > this.config.threshold) {
      analysis.shouldLazyLoad = true;
      analysis.reason = 'Large file size';
    }
    
    // Check if specialist
    if (modulePath.includes('/specialists/') && this.config.specialists) {
      analysis.shouldLazyLoad = true;
      analysis.reason = 'Specialist module';
    }
    
    // Check if department
    if (modulePath.includes('/departments/') && this.config.departments) {
      analysis.shouldLazyLoad = true;
      analysis.reason = 'Department module';
    }
    
    // Check if integration
    if (modulePath.includes('/integrations/') && this.config.integrations) {
      analysis.shouldLazyLoad = true;
      analysis.reason = 'Integration module';
    }
    
    return analysis;
  }
  
  /**
   * Get loading statistics
   */
  getStats() {
    return {
      ...this.stats,
      loadedModules: this.loadedModules.size,
      pendingModules: this.lazyModules.size - this.loadedModules.size,
      deferredModules: this.deferredModules.size,
      totalBytesDeferred: `${(this.stats.bytesDeferred / 1024 / 1024).toFixed(2)} MB`,
      averageLoadTime: this.stats.lazyLoaded > 0
        ? Math.round(this.stats.loadTimesSaved / this.stats.lazyLoaded)
        : 0
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('lazyLoader', 'stats', this.stats);
    stateManager.set('lazyLoader', 'lazyModules', Array.from(this.lazyModules.keys()));
    stateManager.set('lazyLoader', 'loadedModules', Array.from(this.loadedModules));
  }
}

// Singleton instance
let instance = null;

function getLazyLoader() {
  if (!instance) {
    instance = new LazyLoader();
  }
  return instance;
}

// Export
module.exports = {
  LazyLoader,
  getLazyLoader,
  lazyLoader: getLazyLoader(),
  
  // Helper functions
  lazy: (modulePath, options) => getLazyLoader().registerLazy(modulePath, options),
  lazySpecialists: () => getLazyLoader().createSpecialistLoader(),
  lazyDepartments: () => getLazyLoader().createDepartmentLoader()
};