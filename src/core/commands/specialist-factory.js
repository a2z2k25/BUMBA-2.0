/**
 * Specialist Factory
 * Maps specialist IDs to their real implementation classes
 * Part of Sprint 1.5: Make It Real
 * 
 * @deprecated Use specialist-factory-sprint3.js instead
 * This is the original incomplete version kept for compatibility
 */

const { logger } = require('../logging/bumba-logger');

// Import all specialist classes we need for Sprint 1
// Backend specialists
const { ApiArchitectSpecialist } = require('../specialists/technical/database/api-architect');
const { BackendArchitectSpecialist } = require('../specialists/technical/database/backend-architect');

// Frontend specialists  
const { FrontendDeveloperSpecialist } = require('../specialists/experience/frontend-developer');
const { UiDesignSpecialist } = require('../specialists/experience/ui-design');
const { UXResearchSpecialist } = require('../specialists/experience/ux-research-specialist');

// Strategic specialists
const { BusinessAnalystSpecialist } = require('../specialists/strategic/business-analyst');
const { MarketResearchSpecialist } = require('../specialists/strategic/market-research-specialist');
const { ProductManagerSpecialist } = require('../specialists/strategic/product-manager');

/**
 * Specialist class registry
 * Maps specialist IDs to their actual implementation classes
 */
const SPECIALIST_CLASSES = {
  // Backend specialists
  'api-architect': ApiArchitectSpecialist,
  'backend-architect': BackendArchitectSpecialist,
  'backend-developer': BackendArchitectSpecialist, // Using backend architect as backend developer
  
  // Frontend specialists
  'frontend-developer': FrontendDeveloperSpecialist,
  'ui-designer': UiDesignSpecialist,
  'ui-design': UiDesignSpecialist,
  'ux-specialist': UXResearchSpecialist,
  'ux-research': UXResearchSpecialist,
  
  // Strategic specialists
  'business-analyst': BusinessAnalystSpecialist,
  'market-researcher': MarketResearchSpecialist,
  'market-research': MarketResearchSpecialist,
  'product-owner': ProductManagerSpecialist,
  'product-manager': ProductManagerSpecialist,
};

/**
 * Factory for creating real specialist instances
 */
class SpecialistFactory {
  constructor() {
    this.instances = new Map();
    this.classRegistry = SPECIALIST_CLASSES;
    logger.info('🟢 SpecialistFactory initialized with real specialist classes');
  }
  
  /**
   * Create or get a specialist instance
   * @param {string} specialistId - The specialist identifier
   * @param {string} department - The department context
   * @param {object} context - Additional context
   * @returns {object} The specialist instance
   */
  async createSpecialist(specialistId, department = 'general', context = {}) {
    try {
      // Check if we have a cached instance
      const cacheKey = `${specialistId}-${department}`;
      if (this.instances.has(cacheKey)) {
        logger.info(`🟢️ Reusing existing specialist: ${specialistId}`);
        return this.instances.get(cacheKey);
      }
      
      // Get the specialist class
      const SpecialistClass = this.classRegistry[specialistId];
      
      if (!SpecialistClass) {
        logger.warn(`🟠️ No real class found for ${specialistId}, creating mock`);
        return this.createMockSpecialist(specialistId);
      }
      
      // Create new instance
      logger.info(`🆕 Creating real specialist: ${specialistId}`);
      const instance = new SpecialistClass(department, context);
      
      // Initialize if needed
      if (instance.initialize && typeof instance.initialize === 'function') {
        await instance.initialize();
      }
      
      // Cache the instance
      this.instances.set(cacheKey, instance);
      
      return instance;
      
    } catch (error) {
      logger.error(`Failed to create specialist ${specialistId}: ${error.message}`);
      return this.createMockSpecialist(specialistId);
    }
  }
  
  /**
   * Create a mock specialist as fallback
   */
  createMockSpecialist(specialistId) {
    return {
      id: specialistId,
      name: specialistId,
      type: 'mock',
      execute: async (prompt) => {
        return {
          success: true,
          response: `[Mock ${specialistId}] Processing: ${prompt}`,
          specialist: specialistId,
          isMock: true
        };
      },
      release: async () => {
        // Mock release
      }
    };
  }
  
  /**
   * Check if a specialist class exists
   */
  hasSpecialist(specialistId) {
    return !!this.classRegistry[specialistId];
  }
  
  /**
   * Get all available specialist IDs
   */
  getAvailableSpecialists() {
    return Object.keys(this.classRegistry);
  }
  
  /**
   * Clear cached instances
   */
  clearCache() {
    this.instances.clear();
    logger.info('🧹 Specialist instance cache cleared');
  }
  
  /**
   * Get metrics about factory usage
   */
  getMetrics() {
    const available = Object.keys(this.classRegistry).length;
    const cached = this.instances.size;
    const realSpecialists = [];
    const mockSpecialists = [];
    
    for (const [key, instance] of this.instances) {
      if (instance.type === 'mock' || instance.isMock) {
        mockSpecialists.push(key);
      } else {
        realSpecialists.push(key);
      }
    }
    
    return {
      availableClasses: available,
      cachedInstances: cached,
      realSpecialists: realSpecialists.length,
      mockSpecialists: mockSpecialists.length,
      specialists: {
        real: realSpecialists,
        mock: mockSpecialists
      }
    };
  }
}

// Singleton instance
let factoryInstance = null;

/**
 * Get the singleton factory instance
 */
function getFactory() {
  if (!factoryInstance) {
    factoryInstance = new SpecialistFactory();
  }
  return factoryInstance;
}

module.exports = {
  SpecialistFactory,
  getFactory,
  SPECIALIST_CLASSES
};