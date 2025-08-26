/**
 * Module Loader
 * Optimized module loading with bundling support
 * Sprint 18 - Architecture Fix
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { ComponentTimers } = require('../timers/timer-registry');
const { dependencyManager } = require('./dependency-manager');

class ModuleLoader {
  constructor() {
    // Module registry
    this.modules = new Map();
    this.bundles = new Map();
    this.loadQueue = [];
    this.loadingModules = new Set();
    
    // Optimization settings
    this.options = {
      enableBundling: true,
      enableCaching: true,
      enableLazyLoading: true,
      enablePreloading: false,
      bundleSize: 50, // Max modules per bundle
      cacheDir: path.join(process.cwd(), '.bumba-cache')
    };
    
    // Timers
    this.timers = new ComponentTimers('module-loader');
    
    // Statistics
    this.stats = {
      modulesLoaded: 0,
      bundlesCreated: 0,
      cacheHits: 0,
      cacheMisses: 0,
      loadTime: 0
    };
    
    // Ensure cache directory exists
    this.ensureCacheDir();
  }
  
  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.options.cacheDir)) {
      fs.mkdirSync(this.options.cacheDir, { recursive: true });
    }
  }
  
  /**
   * Load module with optimizations
   */
  async loadModule(modulePath, options = {}) {
    const startTime = Date.now();
    
    // Check if already loaded
    if (this.modules.has(modulePath)) {
      this.stats.cacheHits++;
      return this.modules.get(modulePath);
    }
    
    // Check if currently loading (prevent duplicate loads)
    if (this.loadingModules.has(modulePath)) {
      return this.waitForModule(modulePath);
    }
    
    this.loadingModules.add(modulePath);
    
    try {
      let module;
      
      // Check if module is in a bundle
      if (this.options.enableBundling) {
        const bundle = this.findBundle(modulePath);
        if (bundle) {
          module = await this.loadFromBundle(bundle, modulePath);
        }
      }
      
      // Try cache
      if (!module && this.options.enableCaching) {
        module = await this.loadFromCache(modulePath);
      }
      
      // Load normally
      if (!module) {
        if (this.options.enableLazyLoading && options.lazy) {
          module = dependencyManager.createLazyProxy(modulePath);
        } else {
          module = require(modulePath);
        }
        
        // Cache the module
        if (this.options.enableCaching) {
          await this.cacheModule(modulePath, module);
        }
        
        this.stats.cacheMisses++;
      }
      
      // Store in registry
      this.modules.set(modulePath, module);
      this.stats.modulesLoaded++;
      
      // Record load time
      this.stats.loadTime += Date.now() - startTime;
      
      return module;
      
    } finally {
      this.loadingModules.delete(modulePath);
    }
  }
  
  /**
   * Wait for module to finish loading
   */
  async waitForModule(modulePath) {
    while (this.loadingModules.has(modulePath)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return this.modules.get(modulePath);
  }
  
  /**
   * Create bundle of modules
   */
  async createBundle(modules, bundleName) {
    const bundle = {
      name: bundleName,
      modules: new Map(),
      dependencies: new Map(),
      hash: '',
      created: Date.now()
    };
    
    // Analyze dependencies and determine load order
    const loadOrder = dependencyManager.topologicalSort(modules);
    
    // Bundle modules in correct order
    for (const modulePath of loadOrder) {
      if (!modules.includes(modulePath)) continue;
      
      const content = fs.readFileSync(modulePath, 'utf8');
      const deps = dependencyManager.analyzeModule(modulePath);
      
      bundle.modules.set(modulePath, {
        content,
        dependencies: Array.from(deps)
      });
      
      bundle.dependencies.set(modulePath, deps);
    }
    
    // Generate hash
    const bundleContent = JSON.stringify(Array.from(bundle.modules.entries()));
    bundle.hash = crypto.createHash('md5').update(bundleContent).digest('hex');
    
    // Store bundle
    this.bundles.set(bundleName, bundle);
    this.stats.bundlesCreated++;
    
    // Save to disk
    if (this.options.enableCaching) {
      await this.saveBundle(bundle);
    }
    
    return bundle;
  }
  
  /**
   * Load module from bundle
   */
  async loadFromBundle(bundle, modulePath) {
    const moduleData = bundle.modules.get(modulePath);
    
    if (!moduleData) return null;
    
    // Create module from bundled content
    const module = this.createModuleFromContent(moduleData.content, modulePath);
    
    return module;
  }
  
  /**
   * Find bundle containing module
   */
  findBundle(modulePath) {
    for (const [name, bundle] of this.bundles) {
      if (bundle.modules.has(modulePath)) {
        return bundle;
      }
    }
    return null;
  }
  
  /**
   * Create module from content string
   */
  createModuleFromContent(content, modulePath) {
    const module = { exports: {} };
    const dirname = path.dirname(modulePath);
    const filename = modulePath;
    
    // Create module function
    const moduleFunction = new Function(
      'module',
      'exports',
      'require',
      '__dirname',
      '__filename',
      content
    );
    
    // Create custom require for the module
    const customRequire = (depPath) => {
      if (!depPath.startsWith('.')) {
        return require(depPath);
      }
      
      const resolvedPath = path.resolve(dirname, depPath);
      const finalPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
      
      return this.loadModule(finalPath);
    };
    
    // Execute module
    moduleFunction(
      module,
      module.exports,
      customRequire,
      dirname,
      filename
    );
    
    return module.exports;
  }
  
  /**
   * Load module from cache
   */
  async loadFromCache(modulePath) {
    const cacheFile = this.getCacheFilePath(modulePath);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      
      // Check if source file has been modified
      const stats = fs.statSync(modulePath);
      if (stats.mtime.getTime() > cached.timestamp) {
        // Cache is stale
        return null;
      }
      
      this.stats.cacheHits++;
      
      // Reconstruct module
      return this.createModuleFromContent(cached.content, modulePath);
      
    } catch (error) {
      logger.error(`Failed to load from cache: ${modulePath}`, error);
      return null;
    }
  }
  
  /**
   * Cache module
   */
  async cacheModule(modulePath, module) {
    const cacheFile = this.getCacheFilePath(modulePath);
    
    try {
      const content = fs.readFileSync(modulePath, 'utf8');
      
      const cacheData = {
        path: modulePath,
        content,
        timestamp: Date.now(),
        hash: crypto.createHash('md5').update(content).digest('hex')
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
      
    } catch (error) {
      logger.error(`Failed to cache module: ${modulePath}`, error);
    }
  }
  
  /**
   * Get cache file path
   */
  getCacheFilePath(modulePath) {
    const hash = crypto.createHash('md5').update(modulePath).digest('hex');
    return path.join(this.options.cacheDir, `${hash}.json`);
  }
  
  /**
   * Save bundle to disk
   */
  async saveBundle(bundle) {
    const bundleFile = path.join(this.options.cacheDir, `bundle-${bundle.hash}.json`);
    
    try {
      const bundleData = {
        name: bundle.name,
        modules: Array.from(bundle.modules.entries()),
        dependencies: Array.from(bundle.dependencies.entries()),
        hash: bundle.hash,
        created: bundle.created
      };
      
      fs.writeFileSync(bundleFile, JSON.stringify(bundleData));
      
    } catch (error) {
      logger.error(`Failed to save bundle: ${bundle.name}`, error);
    }
  }
  
  /**
   * Load bundle from disk
   */
  async loadBundle(bundleName) {
    const files = fs.readdirSync(this.options.cacheDir);
    
    for (const file of files) {
      if (!file.startsWith('bundle-')) continue;
      
      const bundlePath = path.join(this.options.cacheDir, file);
      
      try {
        const bundleData = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
        
        if (bundleData.name === bundleName) {
          const bundle = {
            name: bundleData.name,
            modules: new Map(bundleData.modules),
            dependencies: new Map(bundleData.dependencies),
            hash: bundleData.hash,
            created: bundleData.created
          };
          
          this.bundles.set(bundleName, bundle);
          return bundle;
        }
      } catch (error) {
        logger.error(`Failed to load bundle: ${file}`, error);
      }
    }
    
    return null;
  }
  
  /**
   * Preload modules
   */
  async preloadModules(modules) {
    const promises = modules.map(modulePath => 
      this.loadModule(modulePath, { lazy: false })
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Create optimized bundles based on usage patterns
   */
  async optimizeBundles() {
    // Group frequently used together modules
    const groups = this.analyzeUsagePatterns();
    
    for (const [groupName, modules] of groups) {
      if (modules.length > 1 && modules.length <= this.options.bundleSize) {
        await this.createBundle(modules, groupName);
      }
    }
  }
  
  /**
   * Analyze module usage patterns
   */
  analyzeUsagePatterns() {
    const patterns = new Map();
    
    // Group by directory
    for (const modulePath of this.modules.keys()) {
      const dir = path.dirname(modulePath);
      
      if (!patterns.has(dir)) {
        patterns.set(dir, []);
      }
      
      patterns.get(dir).push(modulePath);
    }
    
    return patterns;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    if (fs.existsSync(this.options.cacheDir)) {
      const files = fs.readdirSync(this.options.cacheDir);
      
      for (const file of files) {
        fs.unlinkSync(path.join(this.options.cacheDir, file));
      }
    }
    
    this.modules.clear();
    this.bundles.clear();
    
    logger.info('Module cache cleared');
  }
  
  /**
   * Get loader statistics
   */
  getStats() {
    return {
      ...this.stats,
      averageLoadTime: this.stats.modulesLoaded > 0 
        ? Math.round(this.stats.loadTime / this.stats.modulesLoaded) 
        : 0,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      modulesInMemory: this.modules.size,
      bundlesInMemory: this.bundles.size
    };
  }
}

// Singleton instance
let instance = null;

function getModuleLoader() {
  if (!instance) {
    instance = new ModuleLoader();
  }
  return instance;
}

module.exports = {
  ModuleLoader,
  getModuleLoader,
  moduleLoader: getModuleLoader(),
  
  // Helper functions
  loadModule: (path, options) => getModuleLoader().loadModule(path, options),
  createBundle: (modules, name) => getModuleLoader().createBundle(modules, name),
  preload: (modules) => getModuleLoader().preloadModules(modules)
};