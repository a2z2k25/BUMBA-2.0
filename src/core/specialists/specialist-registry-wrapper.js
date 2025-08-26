/**
 * Specialist Registry Wrapper
 * Provides backward compatibility while using lazy loading
 */

const { LazySpecialistRegistry } = require('./specialist-registry-lazy');
const { logger } = require('../logging/bumba-logger');

class SpecialistRegistry {
  constructor() {
    // Use lazy registry internally
    this.lazyRegistry = new LazySpecialistRegistry();
    
    // Maintain compatibility with existing interface
    this.specialists = new Map();
    this.specialistsByCategory = new Map();
    this.taskMappings = new Map();
    this.initialized = true;
    
    // Proxy the metadata as "specialists"
    this.initializeCompatibilityLayer();
    
    logger.info('📦 Specialist Registry initialized with lazy loading');
  }
  
  initializeCompatibilityLayer() {
    // Populate the specialists map with metadata only
    const allSpecialists = this.lazyRegistry.getAllSpecialists();
    
    allSpecialists.forEach(id => {
      // Add a proxy entry that lazy loads when accessed
      this.specialists.set(id, {
        id,
        get: () => this.lazyRegistry.getSpecialist(id)
      });
    });
    
    // Set the size property for compatibility
    Object.defineProperty(this.specialists, 'size', {
      get: () => this.lazyRegistry.specialistMetadata.size
    });
  }
  
  // Maintain existing interface methods
  
  registerSpecialist(id, config) {
    // For compatibility - just store metadata
    this.specialists.set(id, config);
  }
  
  getSpecialist(type) {
    return this.lazyRegistry.getSpecialist(type);
  }
  
  loadSpecialist(type) {
    return this.lazyRegistry.getSpecialist(type);
  }
  
  getSpecialistInstance(type, department, context) {
    return this.lazyRegistry.getSpecialistInstance(type, department, context);
  }
  
  hasSpecialist(type) {
    return this.lazyRegistry.hasSpecialist(type);
  }
  
  searchSpecialists(query) {
    // Return metadata matches
    const results = [];
    const allSpecialists = this.lazyRegistry.getAllSpecialists();
    
    for (const id of allSpecialists) {
      if (id.toLowerCase().includes(query.toLowerCase())) {
        results.push({ type: id, score: 1 });
      }
    }
    
    return results;
  }
  
  getSpecialistsByCategory(category) {
    return this.lazyRegistry.getSpecialistsByCategory(category);
  }
  
  getPerformanceMetrics() {
    const stats = this.lazyRegistry.getStats();
    return {
      ...stats,
      message: `Lazy loading active: ${stats.loadedSpecialists}/${stats.totalSpecialists} loaded, ${stats.memorySaved} saved`
    };
  }
  
  clearExpiredCache() {
    this.lazyRegistry.clearCaches();
  }
}

module.exports = { SpecialistRegistry };