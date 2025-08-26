/**
 * Specialist Factory - Sprint 2 Enhanced
 * Maps specialist IDs to their real implementation classes
 * Includes all specialists needed for 20+ command coverage
 */

const { logger } = require('../logging/bumba-logger');

// ============== SPRINT 1 SPECIALISTS ==============
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

// ============== SPRINT 2 SPECIALISTS ==============
// DevOps & Infrastructure
const { DevopsEngineerSpecialist } = require('../specialists/technical/devops/devops-engineer');
const { SreSpecialist } = require('../specialists/technical/devops/sre-specialist');
const { CloudArchitectSpecialist } = require('../specialists/technical/devops/cloud-architect');

// Security & Database
const { SecuritySpecialist } = require('../specialists/technical/security-specialist');
const { DatabaseAdminSpecialist } = require('../specialists/technical/database/database-admin');
const { DatabaseOptimizerSpecialist } = require('../specialists/technical/database/database-optimizer');

// QA & Testing
const { TestAutomatorSpecialist } = require('../specialists/technical/qa/test-automator');
const { CodeReviewerSpecialist } = require('../specialists/technical/qa/code-reviewer');

// AI & Data
const { AiEngineerSpecialist } = require('../specialists/technical/data-ai/ai-engineer');

/**
 * Complete specialist class registry for Sprint 2
 * Maps specialist IDs to their actual implementation classes
 */
const SPECIALIST_CLASSES = {
  // ============== BACKEND SPECIALISTS ==============
  'api-architect': ApiArchitectSpecialist,
  'backend-architect': BackendArchitectSpecialist,
  'backend-developer': BackendArchitectSpecialist,
  'database-admin': DatabaseAdminSpecialist,
  'database-optimizer': DatabaseOptimizerSpecialist,
  'security-specialist': SecuritySpecialist,
  
  // ============== FRONTEND SPECIALISTS ==============
  'frontend-developer': FrontendDeveloperSpecialist,
  'ui-designer': UiDesignSpecialist,
  'ui-design': UiDesignSpecialist,
  'ux-specialist': UXResearchSpecialist,
  'ux-research': UXResearchSpecialist,
  'ux-research-specialist': UXResearchSpecialist,
  
  // ============== STRATEGIC SPECIALISTS ==============
  'business-analyst': BusinessAnalystSpecialist,
  'market-researcher': MarketResearchSpecialist,
  'market-research': MarketResearchSpecialist,
  'product-owner': ProductManagerSpecialist,
  'product-manager': ProductManagerSpecialist,
  'product-strategist': ProductManagerSpecialist, // Using PM as strategist for now
  
  // ============== DEVOPS & INFRASTRUCTURE ==============
  'devops-engineer': DevopsEngineerSpecialist,
  'sre-specialist': SreSpecialist,
  'cloud-architect': CloudArchitectSpecialist,
  
  // ============== QA & TESTING ==============
  'test-automator': TestAutomatorSpecialist,
  'code-reviewer': CodeReviewerSpecialist,
  
  // ============== AI & DATA ==============
  'ai-engineer': AiEngineerSpecialist,
  
  // ============== DOCUMENTATION ==============
  'technical-writer': BusinessAnalystSpecialist, // Using BA as technical writer for now
};

/**
 * Factory for creating real specialist instances
 */
class SpecialistFactorySprint2 {
  constructor() {
    this.instances = new Map();
    this.classRegistry = SPECIALIST_CLASSES;
    this.metrics = {
      created: 0,
      reused: 0,
      mocked: 0,
      errors: 0
    };
    logger.info(`🟢 Sprint 2 SpecialistFactory initialized with ${Object.keys(SPECIALIST_CLASSES).length} specialist mappings`);
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
        this.metrics.reused++;
        return this.instances.get(cacheKey);
      }
      
      // Get the specialist class
      const SpecialistClass = this.classRegistry[specialistId];
      
      if (!SpecialistClass) {
        logger.warn(`🟠️ No real class found for ${specialistId}, creating mock`);
        this.metrics.mocked++;
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
      this.metrics.created++;
      
      return instance;
      
    } catch (error) {
      logger.error(`Failed to create specialist ${specialistId}: ${error.message}`);
      this.metrics.errors++;
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
   * Create multiple specialists at once
   */
  async createSpecialists(specialistIds, department = 'general', context = {}) {
    const specialists = [];
    for (const id of specialistIds) {
      const specialist = await this.createSpecialist(id, department, context);
      specialists.push(specialist);
    }
    return specialists;
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
      created: this.metrics.created,
      reused: this.metrics.reused,
      mocked: this.metrics.mocked,
      errors: this.metrics.errors,
      specialists: {
        real: realSpecialists,
        mock: mockSpecialists
      }
    };
  }
  
  /**
   * Get specialist coverage report
   */
  getCoverageReport() {
    const covered = [];
    const mocked = [];
    const missing = [];
    
    // Check all registered specialists
    const allNeeded = [
      'api-architect', 'backend-developer', 'ui-designer', 'ux-specialist',
      'frontend-developer', 'product-owner', 'business-analyst', 'market-researcher',
      'devops-engineer', 'product-strategist', 'technical-writer', 'ai-engineer',
      'ux-research-specialist', 'security-specialist', 'database-admin', 'sre-specialist',
      'test-automator', 'cloud-architect', 'code-reviewer', 'database-optimizer'
    ];
    
    allNeeded.forEach(id => {
      if (this.classRegistry[id]) {
        const Class = this.classRegistry[id];
        if (Class.name.includes('Mock')) {
          mocked.push(id);
        } else {
          covered.push(id);
        }
      } else {
        missing.push(id);
      }
    });
    
    return {
      covered,
      mocked,
      missing,
      coverage: (covered.length / allNeeded.length * 100).toFixed(1) + '%'
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
    factoryInstance = new SpecialistFactorySprint2();
  }
  return factoryInstance;
}

module.exports = {
  SpecialistFactorySprint2,
  getFactory,
  SPECIALIST_CLASSES
};