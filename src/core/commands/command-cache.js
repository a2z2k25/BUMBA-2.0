/**
 * Command Cache for Fast Routing
 * Pre-compiles and caches command routes for instant lookup
 */

class CommandCache {
  constructor() {
    this.routeCache = new Map();
    this.specialistCache = new Map();
    this.lastCacheRebuild = Date.now();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Build initial cache
    this.buildCache();
  }
  
  /**
   * Build the command routing cache
   */
  buildCache() {
    // Pre-compile common commands
    const commonCommands = [
      // Development
      { cmd: 'create-api', specialist: 'api-architect', dept: 'backend' },
      { cmd: 'debug', specialist: 'debugger-specialist', dept: 'backend' },
      { cmd: 'review-code', specialist: 'code-reviewer', dept: 'backend' },
      { cmd: 'write-tests', specialist: 'test-automator', dept: 'backend' },
      
      // Frontend
      { cmd: 'create-component', specialist: 'react-specialist', dept: 'design' },
      { cmd: 'design-ui', specialist: 'ui-design', dept: 'design' },
      { cmd: 'improve-ux', specialist: 'ux-research', dept: 'design' },
      
      // Product
      { cmd: 'write-prd', specialist: 'product-manager', dept: 'product' },
      { cmd: 'market-research', specialist: 'market-research', dept: 'product' },
      { cmd: 'analyze-metrics', specialist: 'business-analyst', dept: 'product' },
      
      // DevOps
      { cmd: 'deploy', specialist: 'devops-engineer', dept: 'backend' },
      { cmd: 'setup-ci', specialist: 'devops-engineer', dept: 'backend' },
      { cmd: 'optimize-performance', specialist: 'performance-engineer', dept: 'backend' }
    ];
    
    // Build route map
    commonCommands.forEach(({ cmd, specialist, dept }) => {
      this.routeCache.set(cmd, { specialist, dept, cached: true });
    });
    
    // Build specialist lookup
    this.buildSpecialistLookup();
  }
  
  /**
   * Build specialist keyword lookup
   */
  buildSpecialistLookup() {
    const specialistKeywords = {
      'python': 'python-specialist',
      'javascript': 'javascript-specialist',
      'js': 'javascript-specialist',
      'typescript': 'typescript-specialist',
      'ts': 'typescript-specialist',
      'react': 'react-specialist',
      'vue': 'vue-specialist',
      'angular': 'angular-specialist',
      'database': 'database-admin',
      'sql': 'sql-specialist',
      'api': 'api-architect',
      'security': 'security-auditor',
      'test': 'test-automator',
      'debug': 'debugger-specialist',
      'deploy': 'devops-engineer',
      'cloud': 'cloud-architect',
      'kubernetes': 'kubernetes-specialist',
      'k8s': 'kubernetes-specialist'
    };
    
    Object.entries(specialistKeywords).forEach(([keyword, specialist]) => {
      this.specialistCache.set(keyword, specialist);
    });
  }
  
  /**
   * Fast command lookup
   */
  lookup(command) {
    // Direct cache hit
    if (this.routeCache.has(command)) {
      this.cacheHits++;
      return this.routeCache.get(command);
    }
    
    // Try keyword matching
    const keywords = command.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      if (this.specialistCache.has(keyword)) {
        this.cacheHits++;
        const specialist = this.specialistCache.get(keyword);
        const result = {
          specialist,
          dept: this.getDepartmentForSpecialist(specialist),
          keyword: true
        };
        
        // Cache this for next time
        this.routeCache.set(command, result);
        return result;
      }
    }
    
    this.cacheMisses++;
    return null;
  }
  
  /**
   * Get department for a specialist
   */
  getDepartmentForSpecialist(specialist) {
    // Quick department mapping
    if (specialist.includes('design') || specialist.includes('ui') || 
        specialist.includes('ux') || specialist.includes('frontend')) {
      return 'design';
    }
    
    if (specialist.includes('product') || specialist.includes('market') || 
        specialist.includes('business')) {
      return 'product';
    }
    
    // Default to backend for technical specialists
    return 'backend';
  }
  
  /**
   * Add a route to cache
   */
  addRoute(command, specialist, dept) {
    this.routeCache.set(command, { specialist, dept, cached: true });
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0 
      ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2)
      : 0;
    
    return {
      routes: this.routeCache.size,
      keywords: this.specialistCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      age: Date.now() - this.lastCacheRebuild
    };
  }
  
  /**
   * Clear and rebuild cache
   */
  rebuild() {
    this.routeCache.clear();
    this.specialistCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastCacheRebuild = Date.now();
    this.buildCache();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getCache: () => {
    if (!instance) {
      instance = new CommandCache();
    }
    return instance;
  },
  
  lookupCommand: (command) => {
    return module.exports.getCache().lookup(command);
  },
  
  getCacheStats: () => {
    return module.exports.getCache().getStats();
  }
};