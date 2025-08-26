/**
 * BUMBA Specialist Activator
 * Transforms placeholder specialists into fully operational agents
 * This is the system that brings all 78+ specialists to life
 */

const UnifiedSpecialistBase = require('./unified-specialist-base');
const knowledgeTemplates = require('./knowledge-templates');
const specialistRegistry = require('./specialist-registry');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class SpecialistActivator {
  constructor() {
    this.activatedSpecialists = new Map();
    this.activationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      categories: {}
    };
  }
  
  /**
   * Activate a single specialist by type
   */
  async activateSpecialist(specialistType) {
    try {
      // Check if already activated
      if (this.activatedSpecialists.has(specialistType)) {
        return this.activatedSpecialists.get(specialistType);
      }
      
      // Get specialist configuration from registry
      const config = specialistRegistry.getSpecialist(specialistType);
      if (!config) {
        throw new Error(`Specialist ${specialistType} not found in registry`);
      }
      
      // Get knowledge template
      const template = knowledgeTemplates.getTemplate(specialistType, config.category);
      
      // Create operational specialist
      const specialist = this.createOperationalSpecialist(specialistType, config, template);
      
      // Store activated specialist
      this.activatedSpecialists.set(specialistType, specialist);
      
      // Update stats
      this.updateStats(config.category, true);
      
      logger.info(`🏁 Activated specialist: ${specialist.name}`);
      
      return specialist;
      
    } catch (error) {
      logger.error(`Failed to activate ${specialistType}:`, error);
      this.updateStats('unknown', false);
      throw error;
    }
  }
  
  /**
   * Create an operational specialist from config and template
   */
  createOperationalSpecialist(type, config, template) {
    // Merge configuration with template
    const specialistConfig = {
      id: `${type}_${Date.now()}`,
      type: type,
      name: template.name || config.name,
      category: config.category,
      department: this.mapCategoryToDepartment(config.category),
      
      // Knowledge and capabilities
      expertise: template.expertise || config.expertise || {},
      capabilities: template.capabilities || config.capabilities || [],
      keywords: config.keywords || [],
      tools: template.tools || [],
      frameworks: template.frameworks || [],
      
      // Best practices and patterns
      bestPractices: template.bestPractices || [],
      codePatterns: template.codePatterns || {},
      
      // System prompt additions
      additionalContext: template.systemPromptAdditions || '',
      
      // Execution config
      temperature: template.temperature || 0.7,
      model: this.selectOptimalModel(config.category, type)
    };
    
    // Create operational specialist
    return new UnifiedSpecialistBase(specialistConfig);
  }
  
  /**
   * Batch activate all specialists in a category
   */
  async activateCategory(category) {
    const specialists = specialistRegistry.getSpecialistsByCategory(category);
    const results = {
      category,
      total: specialists.length,
      activated: [],
      failed: []
    };
    
    for (const specialistType of specialists) {
      try {
        const specialist = await this.activateSpecialist(specialistType);
        results.activated.push(specialistType);
      } catch (error) {
        results.failed.push({ type: specialistType, error: error.message });
      }
    }
    
    logger.info(`Category ${category}: ${results.activated.length}/${results.total} activated`);
    
    return results;
  }
  
  /**
   * Activate ALL specialists in the system
   */
  async activateAllSpecialists() {
    logger.info('🟢 Starting activation of all specialists...');
    
    const categories = [
      'technical',
      'experience', 
      'strategic',
      'documentation',
      'specialized',
      'database'
    ];
    
    const results = {
      totalSpecialists: 0,
      totalActivated: 0,
      byCategory: {}
    };
    
    for (const category of categories) {
      const categoryResult = await this.activateCategory(category);
      results.byCategory[category] = categoryResult;
      results.totalSpecialists += categoryResult.total;
      results.totalActivated += categoryResult.activated.length;
    }
    
    logger.info(`🏁 Activation complete: ${results.totalActivated}/${results.totalSpecialists} specialists activated`);
    
    return results;
  }
  
  /**
   * Activate specialists on-demand (lazy loading)
   */
  async getOrActivateSpecialist(specialistType) {
    if (this.activatedSpecialists.has(specialistType)) {
      return this.activatedSpecialists.get(specialistType);
    }
    
    return await this.activateSpecialist(specialistType);
  }
  
  /**
   * Map category to department
   */
  mapCategoryToDepartment(category) {
    const mapping = {
      'technical': 'backend',
      'experience': 'design',
      'strategic': 'product',
      'database': 'backend',
      'documentation': 'product',
      'specialized': 'backend'
    };
    
    return mapping[category] || 'general';
  }
  
  /**
   * Select optimal model based on specialist type
   */
  selectOptimalModel(category, type) {
    // Reasoning-heavy specialists
    if (category === 'strategic' || type.includes('architect') || type.includes('analyst')) {
      return 'claude-3-opus-20240229';
    }
    
    // Code generation specialists
    if (category === 'technical' || type.includes('developer') || type.includes('engineer')) {
      return 'gpt-4-turbo-preview';
    }
    
    // Documentation specialists
    if (category === 'documentation' || type.includes('writer')) {
      return 'claude-3-sonnet-20240229';
    }
    
    // Fast response specialists
    if (type.includes('support') || type.includes('assistant')) {
      return 'claude-3-haiku-20240307';
    }
    
    // Default balanced model
    return 'claude-3-sonnet-20240229';
  }
  
  /**
   * Update activation statistics
   */
  updateStats(category, success) {
    this.activationStats.total++;
    
    if (success) {
      this.activationStats.successful++;
    } else {
      this.activationStats.failed++;
    }
    
    if (!this.activationStats.categories[category]) {
      this.activationStats.categories[category] = { success: 0, failed: 0 };
    }
    
    if (success) {
      this.activationStats.categories[category].success++;
    } else {
      this.activationStats.categories[category].failed++;
    }
  }
  
  /**
   * Get activation status report
   */
  getActivationStatus() {
    const totalInRegistry = specialistRegistry.getSpecialistCount();
    const totalActivated = this.activatedSpecialists.size;
    
    return {
      summary: {
        total: totalInRegistry,
        activated: totalActivated,
        pending: totalInRegistry - totalActivated,
        percentage: (totalActivated / totalInRegistry * 100).toFixed(1) + '%'
      },
      stats: this.activationStats,
      activatedSpecialists: Array.from(this.activatedSpecialists.keys()),
      readyForUse: totalActivated > 0
    };
  }
  
  /**
   * Test an activated specialist
   */
  async testSpecialist(specialistType, testTask = null) {
    try {
      const specialist = await this.getOrActivateSpecialist(specialistType);
      
      const task = testTask || `Demonstrate your expertise as a ${specialist.name}`;
      
      const result = await specialist.processTask(task);
      
      return {
        success: result.success,
        specialist: specialistType,
        response: result.result,
        confidence: result.confidence,
        duration: result.duration
      };
      
    } catch (error) {
      return {
        success: false,
        specialist: specialistType,
        error: error.message
      };
    }
  }
  
  /**
   * Batch test multiple specialists
   */
  async testSpecialists(specialistTypes, testTask = null) {
    const results = [];
    
    for (const type of specialistTypes) {
      const result = await this.testSpecialist(type, testTask);
      results.push(result);
    }
    
    return {
      tested: specialistTypes.length,
      successful: results.filter(r => r.success).length,
      results
    };
  }
  
  /**
   * Generate activation script for a specialist file
   * This upgrades existing placeholder specialists
   */
  generateUpgradeScript(specialistType) {
    const config = specialistRegistry.getSpecialist(specialistType);
    const template = knowledgeTemplates.getTemplate(specialistType, config.category);
    
    return `
/**
 * Auto-generated upgrade for ${config.name}
 * Generated by BUMBA Specialist Activator
 */

const UnifiedSpecialistBase = require('../unified-specialist-base');

class ${this.toPascalCase(specialistType)} extends UnifiedSpecialistBase {
  constructor(department, context = {}) {
    super({
      type: '${specialistType}',
      name: '${template.name || config.name}',
      category: '${config.category}',
      department: department || '${this.mapCategoryToDepartment(config.category)}',
      
      expertise: ${JSON.stringify(template.expertise || config.expertise || {}, null, 2)},
      
      capabilities: ${JSON.stringify(template.capabilities || config.capabilities || [], null, 2)},
      
      keywords: ${JSON.stringify(config.keywords || [], null, 2)},
      
      tools: ${JSON.stringify(template.tools || [], null, 2)},
      
      frameworks: ${JSON.stringify(template.frameworks || [], null, 2)},
      
      bestPractices: ${JSON.stringify(template.bestPractices || [], null, 2)},
      
      codePatterns: ${JSON.stringify(template.codePatterns || {}, null, 2)},
      
      additionalContext: \`${template.systemPromptAdditions || ''}\`,
      
      ...context
    });
  }
}

module.exports = ${this.toPascalCase(specialistType)};
`;
  }
  
  /**
   * Upgrade an existing specialist file
   */
  async upgradeSpecialistFile(specialistType) {
    const config = specialistRegistry.getSpecialist(specialistType);
    if (!config || !config.path) {
      throw new Error(`Cannot upgrade ${specialistType}: path not found`);
    }
    
    const filePath = path.join(__dirname, config.path + '.js');
    const backupPath = filePath + '.backup';
    
    // Create backup
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Generate and write upgrade
    const upgradeCode = this.generateUpgradeScript(specialistType);
    fs.writeFileSync(filePath, upgradeCode);
    
    logger.info(`🏁 Upgraded specialist file: ${filePath}`);
    
    return {
      specialist: specialistType,
      path: filePath,
      backup: backupPath
    };
  }
  
  /**
   * Batch upgrade specialist files
   */
  async upgradeSpecialistFiles(specialistTypes) {
    const results = {
      upgraded: [],
      failed: []
    };
    
    for (const type of specialistTypes) {
      try {
        const result = await this.upgradeSpecialistFile(type);
        results.upgraded.push(result);
      } catch (error) {
        results.failed.push({ type, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Helper: Convert to PascalCase
   */
  toPascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  /**
   * Export activated specialist for use
   */
  exportSpecialist(specialistType) {
    const specialist = this.activatedSpecialists.get(specialistType);
    if (!specialist) {
      throw new Error(`Specialist ${specialistType} not activated`);
    }
    
    return specialist;
  }
  
  /**
   * Clear all activated specialists (for testing)
   */
  clearActivatedSpecialists() {
    this.activatedSpecialists.clear();
    this.activationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      categories: {}
    };
  }
}

// Export singleton instance
const activator = new SpecialistActivator();

module.exports = {
  SpecialistActivator,
  activator,
  
  // Convenience functions
  activateSpecialist: (type) => activator.activateSpecialist(type),
  activateAll: () => activator.activateAllSpecialists(),
  getSpecialist: (type) => activator.getOrActivateSpecialist(type),
  testSpecialist: (type, task) => activator.testSpecialist(type, task),
  getStatus: () => activator.getActivationStatus()
};