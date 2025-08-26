/**
 * Dependency Manager
 * Resolves circular dependencies and manages module loading
 * Sprint 17-20 - Architecture Fix
 */

const path = require('path');
const fs = require('fs');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');
const EventEmitter = require('events');

class DependencyManager extends EventEmitter {
  constructor() {
    super();
    
    // Dependency tracking
    this.dependencies = new Map(); // module -> dependencies
    this.dependents = new Map(); // module -> dependents
    this.circularDeps = new Set(); // circular dependency chains
    this.loadOrder = []; // topological sort order
    this.moduleCache = new Map(); // lazy-loaded modules
    
    // Module boundaries
    this.boundaries = new Map();
    this.violations = [];
    
    // Timers
    this.timers = new ComponentTimers('dependency-manager');
    
    // Stats
    this.stats = {
      modulesAnalyzed: 0,
      circularDepsFound: 0,
      boundaryViolations: 0,
      lazyLoaded: 0,
      cacheHits: 0
    };
    
    // Register state
    stateManager.register('dependencies', {
      stats: this.stats,
      circularDeps: [],
      violations: []
    });
    
    // Define module boundaries
    this.defineBoundaries();
  }
  
  /**
   * Define module boundaries to prevent unwanted dependencies
   */
  defineBoundaries() {
    // Core modules should not depend on specialists
    this.setBoundary('core', {
      allowed: ['core', 'utils', 'config'],
      forbidden: ['specialists', 'departments', 'commands']
    });
    
    // Specialists should not depend on each other
    this.setBoundary('specialists', {
      allowed: ['core', 'utils'],
      forbidden: ['specialists', 'departments']
    });
    
    // Departments can use specialists but not commands
    this.setBoundary('departments', {
      allowed: ['core', 'utils', 'specialists'],
      forbidden: ['commands']
    });
    
    // Commands orchestrate everything
    this.setBoundary('commands', {
      allowed: ['core', 'utils', 'specialists', 'departments'],
      forbidden: []
    });
    
    // Security modules are isolated
    this.setBoundary('security', {
      allowed: ['core/logging', 'core/state', 'utils'],
      forbidden: ['specialists', 'departments', 'commands']
    });
    
    // Auth modules are isolated
    this.setBoundary('auth', {
      allowed: ['security', 'core/logging', 'core/state'],
      forbidden: ['specialists', 'departments', 'commands']
    });
  }
  
  /**
   * Set boundary rules for a module category
   */
  setBoundary(category, rules) {
    this.boundaries.set(category, rules);
  }
  
  /**
   * Analyze module dependencies
   */
  analyzeModule(modulePath) {
    if (this.dependencies.has(modulePath)) {
      return this.dependencies.get(modulePath);
    }
    
    const deps = new Set();
    
    try {
      const content = fs.readFileSync(modulePath, 'utf8');
      
      // Find require statements
      const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
      let match;
      
      while ((match = requirePattern.exec(content)) !== null) {
        const depPath = match[1];
        
        // Skip node_modules
        if (!depPath.startsWith('.')) continue;
        
        // Resolve relative path
        const resolvedPath = path.resolve(path.dirname(modulePath), depPath);
        
        // Check for .js extension
        const finalPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
        
        if (fs.existsSync(finalPath)) {
          deps.add(finalPath);
          
          // Track dependent relationship
          if (!this.dependents.has(finalPath)) {
            this.dependents.set(finalPath, new Set());
          }
          this.dependents.get(finalPath).add(modulePath);
        }
      }
      
      // Find import statements
      const importPattern = /import\s+(?:[\w{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
      while ((match = importPattern.exec(content)) !== null) {
        const depPath = match[1];
        if (!depPath.startsWith('.')) continue;
        
        const resolvedPath = path.resolve(path.dirname(modulePath), depPath);
        const finalPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
        
        if (fs.existsSync(finalPath)) {
          deps.add(finalPath);
          
          if (!this.dependents.has(finalPath)) {
            this.dependents.set(finalPath, new Set());
          }
          this.dependents.get(finalPath).add(modulePath);
        }
      }
      
      this.dependencies.set(modulePath, deps);
      this.stats.modulesAnalyzed++;
      
    } catch (error) {
      logger.error(`Failed to analyze module ${modulePath}:`, error);
    }
    
    return deps;
  }
  
  /**
   * Detect circular dependencies
   */
  detectCircular(startModule, visited = new Set(), path = []) {
    if (visited.has(startModule)) {
      // Found circular dependency
      const circularPath = [...path, startModule];
      const startIdx = circularPath.indexOf(startModule);
      const circle = circularPath.slice(startIdx);
      
      this.circularDeps.add(circle.join(' -> '));
      this.stats.circularDepsFound++;
      
      logger.warn('Circular dependency detected:', circle.join(' -> '));
      
      return true;
    }
    
    visited.add(startModule);
    path.push(startModule);
    
    const deps = this.analyzeModule(startModule);
    let hasCircular = false;
    
    for (const dep of deps) {
      if (this.detectCircular(dep, new Set(visited), [...path])) {
        hasCircular = true;
      }
    }
    
    return hasCircular;
  }
  
  /**
   * Check boundary violations
   */
  checkBoundaries(modulePath) {
    const category = this.getModuleCategory(modulePath);
    if (!category) return true;
    
    const rules = this.boundaries.get(category);
    if (!rules) return true;
    
    const deps = this.analyzeModule(modulePath);
    
    for (const dep of deps) {
      const depCategory = this.getModuleCategory(dep);
      
      // Check if forbidden
      if (rules.forbidden.includes(depCategory)) {
        this.violations.push({
          module: modulePath,
          dependency: dep,
          rule: `${category} cannot depend on ${depCategory}`
        });
        
        this.stats.boundaryViolations++;
        
        logger.warn(`Boundary violation: ${modulePath} -> ${dep}`);
        return false;
      }
      
      // Check if not in allowed list
      if (rules.allowed.length > 0 && !rules.allowed.includes(depCategory)) {
        this.violations.push({
          module: modulePath,
          dependency: dep,
          rule: `${category} can only depend on ${rules.allowed.join(', ')}`
        });
        
        this.stats.boundaryViolations++;
        
        logger.warn(`Boundary violation: ${modulePath} -> ${dep}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get module category from path
   */
  getModuleCategory(modulePath) {
    if (modulePath.includes('/specialists/')) return 'specialists';
    if (modulePath.includes('/departments/')) return 'departments';
    if (modulePath.includes('/commands/')) return 'commands';
    if (modulePath.includes('/security/')) return 'security';
    if (modulePath.includes('/auth/')) return 'auth';
    if (modulePath.includes('/core/')) return 'core';
    if (modulePath.includes('/utils/')) return 'utils';
    if (modulePath.includes('/config/')) return 'config';
    return null;
  }
  
  /**
   * Topological sort for load order
   */
  topologicalSort(modules) {
    const visited = new Set();
    const stack = [];
    
    const visit = (module) => {
      if (visited.has(module)) return;
      visited.add(module);
      
      const deps = this.dependencies.get(module) || new Set();
      for (const dep of deps) {
        visit(dep);
      }
      
      stack.push(module);
    };
    
    for (const module of modules) {
      visit(module);
    }
    
    this.loadOrder = stack;
    return stack;
  }
  
  /**
   * Lazy load module
   */
  lazyLoad(modulePath) {
    // Check cache
    if (this.moduleCache.has(modulePath)) {
      this.stats.cacheHits++;
      return this.moduleCache.get(modulePath);
    }
    
    try {
      // Check for circular dependencies before loading
      if (this.detectCircular(modulePath)) {
        logger.warn(`Cannot lazy load ${modulePath} due to circular dependencies`);
        return null;
      }
      
      // Check boundaries
      if (!this.checkBoundaries(modulePath)) {
        logger.warn(`Cannot lazy load ${modulePath} due to boundary violations`);
        return null;
      }
      
      // Load module
      const module = require(modulePath);
      this.moduleCache.set(modulePath, module);
      this.stats.lazyLoaded++;
      
      this.emit('module-loaded', { path: modulePath });
      
      return module;
      
    } catch (error) {
      logger.error(`Failed to lazy load ${modulePath}:`, error);
      return null;
    }
  }
  
  /**
   * Create lazy loader proxy
   */
  createLazyProxy(modulePath) {
    let module = null;
    
    return new Proxy({}, {
      get: (target, prop) => {
        if (!module) {
          module = this.lazyLoad(modulePath);
        }
        return module ? module[prop] : undefined;
      }
    });
  }
  
  /**
   * Analyze entire codebase
   */
  async analyzeCodebase(rootPath) {
    const modules = [];
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (file.endsWith('.js')) {
          modules.push(filePath);
        }
      }
    };
    
    scanDirectory(rootPath);
    
    // Analyze all modules
    for (const module of modules) {
      this.analyzeModule(module);
      this.detectCircular(module);
      this.checkBoundaries(module);
    }
    
    // Calculate load order
    this.topologicalSort(modules);
    
    // Update state
    this.updateState();
    
    return {
      totalModules: modules.length,
      circularDeps: this.stats.circularDepsFound,
      violations: this.stats.boundaryViolations,
      loadOrder: this.loadOrder.length
    };
  }
  
  /**
   * Fix circular dependency by breaking the cycle
   */
  breakCircularDependency(modulePath, dependencyPath) {
    // Convert to lazy loading
    const content = fs.readFileSync(modulePath, 'utf8');
    
    // Replace require with lazy require
    const lazyRequire = `
// Lazy loaded to prevent circular dependency
let _lazyModule = null;
const get${path.basename(dependencyPath, '.js')} = () => {
  if (!_lazyModule) {
    _lazyModule = require('${dependencyPath}');
  }
  return _lazyModule;
};`;
    
    const newContent = content.replace(
      `require('${dependencyPath}')`,
      `get${path.basename(dependencyPath, '.js')}()`
    );
    
    fs.writeFileSync(modulePath, newContent);
    
    logger.info(`Fixed circular dependency in ${modulePath}`);
  }
  
  /**
   * Generate dependency report
   */
  generateReport() {
    const report = {
      stats: this.stats,
      circularDependencies: Array.from(this.circularDeps),
      boundaryViolations: this.violations,
      moduleCount: this.dependencies.size,
      mostDependedOn: this.getMostDependedOn(),
      mostDependencies: this.getMostDependencies()
    };
    
    return report;
  }
  
  /**
   * Get most depended on modules
   */
  getMostDependedOn() {
    const sorted = Array.from(this.dependents.entries())
      .map(([module, deps]) => ({ module, count: deps.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return sorted;
  }
  
  /**
   * Get modules with most dependencies
   */
  getMostDependencies() {
    const sorted = Array.from(this.dependencies.entries())
      .map(([module, deps]) => ({ module, count: deps.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return sorted;
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('dependencies', 'stats', this.stats);
    stateManager.set('dependencies', 'circularDeps', Array.from(this.circularDeps));
    stateManager.set('dependencies', 'violations', this.violations);
  }
}

// Singleton instance
let instance = null;

function getDependencyManager() {
  if (!instance) {
    instance = new DependencyManager();
  }
  return instance;
}

module.exports = {
  DependencyManager,
  getDependencyManager,
  dependencyManager: getDependencyManager(),
  
  // Lazy loading helper
  lazyRequire: (modulePath) => {
    return getDependencyManager().createLazyProxy(modulePath);
  }
};