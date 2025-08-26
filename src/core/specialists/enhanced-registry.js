/**
 * BUMBA Enhanced Specialist Registry
 * Improvements for pinnacle-level reliability
 */

class EnhancedRegistry {
  /**
   * Enhanced error handling for registry operations
   */
  static safeGetSpecialist(registry, type) {
    if (!type || typeof type !== 'string') {
      return null;
    }
    
    try {
      return registry.getSpecialist(type);
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Enhanced task matching with better accuracy
   */
  static improvedTaskMatching(registry, task) {
    if (!task || typeof task !== 'string') {
      return [];
    }
    
    const taskLower = task.toLowerCase();
    const matches = [];
    const scores = new Map();
    
    // Get all specialists
    const allTypes = registry.getAllTypes();
    
    for (const type of allTypes) {
      const spec = registry.getSpecialist(type);
      if (!spec) continue;
      
      let score = 0;
      
      // Check type name match
      if (taskLower.includes(type.replace('-specialist', '').replace('-', ' '))) {
        score += 10;
      }
      
      // Check keywords
      if (spec.keywords) {
        for (const keyword of spec.keywords) {
          if (taskLower.includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }
      
      // Check expertise
      if (spec.expertise) {
        for (const exp of spec.expertise) {
          if (taskLower.includes(exp.toLowerCase())) {
            score += 3;
          }
        }
      }
      
      // Check for specific patterns
      const patterns = {
        'react': ['react', 'frontend', 'ui', 'component'],
        'typescript': ['typescript', 'types', 'typed', 'ts'],
        'kubernetes': ['kubernetes', 'k8s', 'cluster', 'orchestration'],
        'postgresql': ['postgresql', 'postgres', 'sql', 'database', 'db'],
        'oauth': ['oauth', 'auth', 'authentication', 'jwt', 'token'],
        'machine learning': ['ml', 'machine learning', 'ai', 'model', 'training']
      };
      
      for (const [key, terms] of Object.entries(patterns)) {
        if (terms.some(term => taskLower.includes(term))) {
          if (type.includes(key.replace(' ', '-'))) {
            score += 8;
          }
        }
      }
      
      if (score > 0) {
        scores.set(type, score);
        matches.push({ type, ...spec, score });
      }
    }
    
    // Sort by score
    return matches.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Cache management for better performance
   */
  static setupCaching(activator) {
    if (!activator._cache) {
      activator._cache = new Map();
      activator._cacheTimestamps = new Map();
      activator._cacheTimeout = 60000; // 1 minute
    }
    
    const originalActivate = activator.activateSpecialist.bind(activator);
    
    activator.activateSpecialist = async function(type) {
      const now = Date.now();
      
      // Check cache
      if (this._cache.has(type)) {
        const timestamp = this._cacheTimestamps.get(type);
        if (now - timestamp < this._cacheTimeout) {
          // Return cloned object to prevent mutations
          return JSON.parse(JSON.stringify(this._cache.get(type)));
        }
      }
      
      // Activate and cache
      const specialist = await originalActivate(type);
      this._cache.set(type, specialist);
      this._cacheTimestamps.set(type, now);
      
      return specialist;
    };
    
    // Add cache clear method
    activator.clearCache = function() {
      this._cache.clear();
      this._cacheTimestamps.clear();
    };
  }
  
  /**
   * Validate specialist has required expertise
   */
  static validateSpecialistExpertise(specialist) {
    if (!specialist) return false;
    
    // Check for essential properties
    const hasName = specialist.name || specialist.type;
    const hasCapabilities = specialist.capabilities && specialist.capabilities.length > 0;
    const hasExpertise = specialist.expertise && Object.keys(specialist.expertise).length > 0;
    
    // For language specialists, ensure comprehensive capabilities
    if (specialist.type && specialist.type.includes('-specialist')) {
      const isLanguageSpec = ['python', 'javascript', 'java', 'golang', 'rust', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'typescript', 'elixir'].some(
        lang => specialist.type.includes(lang)
      );
      
      if (isLanguageSpec) {
        // Language specialists should have at least 10 capabilities
        return hasName && specialist.capabilities && specialist.capabilities.length >= 10;
      }
    }
    
    return hasName && (hasCapabilities || hasExpertise);
  }
  
  /**
   * Handle null/undefined gracefully
   */
  static safeOperation(fn, defaultReturn = null) {
    return function(...args) {
      try {
        // Filter out null/undefined args
        const safeArgs = args.map(arg => arg === null || arg === undefined ? '' : arg);
        return fn.apply(this, safeArgs) || defaultReturn;
      } catch (e) {
        return defaultReturn;
      }
    };
  }
  
  /**
   * Apply enhancements to registry
   */
  static enhance(registry) {
    // Wrap methods with safe operations
    const originalFind = registry.findSpecialistsForTask;
    registry.findSpecialistsForTask = this.safeOperation(
      (task) => this.improvedTaskMatching(registry, task),
      []
    );
    
    const originalGet = registry.getSpecialist;
    registry.getSpecialist = this.safeOperation(
      (type) => this.safeGetSpecialist(registry, type),
      null
    );
    
    // Add validation method
    registry.validateSpecialist = this.validateSpecialistExpertise;
    
    return registry;
  }
}

module.exports = EnhancedRegistry;