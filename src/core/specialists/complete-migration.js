/**
 * BUMBA Specialist Migration Completion Script
 * Finalizes the migration of all specialists to the unified base class
 * Works without API dependencies - ready for future API integration
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

/**
 * Migration configuration
 */
const MIGRATION_CONFIG = {
  baseClasses: {
    old: ['SpecialistBase', 'EnhancedSpecialist', 'SpecialistAgent'],
    new: 'OperationalSpecialist',
    unified: 'UnifiedSpecialistBase'
  },
  directories: [
    'src/core/specialists/technical',
    'src/core/specialists/strategic', 
    'src/core/specialists/experience',
    'src/core/specialists/specialized'
  ],
  backup: true,
  dryRun: false
};

/**
 * Unified Specialist Base Template
 */
const UNIFIED_BASE_TEMPLATE = `/**
 * BUMBA Unified Specialist Base
 * Single source of truth for all specialist implementations
 * API-agnostic design ready for future integration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedErrorManager } = require('../error-handling/unified-error-manager');

class UnifiedSpecialistBase extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Core identity
    this.id = config.id || \`specialist_\${Date.now()}\`;
    this.name = config.name || 'Specialist';
    this.type = config.type || 'general';
    this.category = config.category || 'technical';
    this.department = config.department || null;
    
    // Capabilities definition (API-agnostic)
    this.expertise = config.expertise || {};
    this.capabilities = config.capabilities || [];
    this.keywords = config.keywords || [];
    this.tools = config.tools || [];
    this.frameworks = config.frameworks || [];
    
    // Knowledge templates (work without API)
    this.templates = {
      analysis: config.analysisTemplate || this.getDefaultAnalysisTemplate(),
      implementation: config.implementationTemplate || this.getDefaultImplementationTemplate(),
      review: config.reviewTemplate || this.getDefaultReviewTemplate()
    };
    
    // API placeholder configuration
    this.apiConfig = {
      provider: config.apiProvider || 'pending', // anthropic, openai, etc.
      model: config.apiModel || 'pending',
      apiKey: config.apiKey || process.env[\`\${this.type.toUpperCase()}_API_KEY\`] || null,
      endpoint: config.apiEndpoint || null,
      ready: false // Will be set to true when API is configured
    };
    
    // Execution configuration
    this.config = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      cacheEnabled: config.cacheEnabled !== false,
      offlineMode: config.offlineMode || !this.apiConfig.apiKey,
      ...config
    };
    
    // State and metrics
    this.status = 'initializing';
    this.cache = new Map();
    this.metrics = {
      tasksProcessed: 0,
      successRate: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      apiCalls: 0,
      offlineExecutions: 0
    };
    
    // Error handler
    this.errorManager = new UnifiedErrorManager();
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize specialist
   */
  async initialize() {
    try {
      // Check API availability
      this.apiConfig.ready = await this.checkAPIAvailability();
      
      // Set operational mode
      this.config.offlineMode = !this.apiConfig.ready;
      
      if (this.config.offlineMode) {
        logger.info(\`🔌 \${this.name} initialized in OFFLINE mode (API will be configured by user)\`);
      } else {
        logger.info(\`🏁 \${this.name} initialized with API support\`);
      }
      
      this.status = 'ready';
      this.emit('initialized', { specialist: this.id, mode: this.config.offlineMode ? 'offline' : 'online' });
      
    } catch (error) {
      await this.errorManager.handleError(error, { component: this.name });
      this.status = 'error';
    }
  }
  
  /**
   * Check if API is available (without making actual calls)
   */
  async checkAPIAvailability() {
    // Simply check if API key exists
    // Future adopters will add their actual API validation here
    return !!this.apiConfig.apiKey && this.apiConfig.apiKey !== 'pending';
  }
  
  /**
   * Process task - works in both online and offline modes
   */
  async processTask(task, context = {}) {
    const startTime = Date.now();
    
    try {
      this.metrics.tasksProcessed++;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCached(task);
        if (cached) {
          this.metrics.cacheHits++;
          return cached;
        }
      }
      
      let result;
      
      if (this.config.offlineMode) {
        // Offline processing using templates and patterns
        result = await this.processOffline(task, context);
        this.metrics.offlineExecutions++;
      } else {
        // Online processing with API
        result = await this.processWithAPI(task, context);
        this.metrics.apiCalls++;
      }
      
      // Cache result
      if (this.config.cacheEnabled && result.success) {
        this.setCached(task, result);
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(result.success, responseTime);
      
      return result;
      
    } catch (error) {
      const handled = await this.errorManager.handleError(error, {
        component: this.name,
        task,
        context
      });
      
      if (handled.recovered) {
        return handled.recovery.result;
      }
      
      return {
        success: false,
        error: handled.error.enhancedMessage,
        suggestions: handled.error.suggestions
      };
    }
  }
  
  /**
   * Process task offline using templates and patterns
   */
  async processOffline(task, context) {
    // Determine task type
    const taskType = this.classifyTask(task);
    const template = this.templates[taskType] || this.templates.analysis;
    
    // Apply template
    const result = await this.applyTemplate(template, task, context);
    
    return {
      success: true,
      type: taskType,
      result,
      mode: 'offline',
      message: 'Processed using local templates (API integration pending)'
    };
  }
  
  /**
   * Process task with API (placeholder for future implementation)
   */
  async processWithAPI(task, context) {
    // This is where future adopters will add their API calls
    // For now, return a placeholder that indicates API readiness
    
    return {
      success: true,
      type: 'api_ready',
      result: {
        message: 'API endpoint ready for integration',
        config: this.apiConfig,
        task
      },
      mode: 'online'
    };
  }
  
  /**
   * Apply template to task
   */
  async applyTemplate(template, task, context) {
    // Template-based processing that works without API
    const processed = {
      task: task.description || task,
      analysis: template.analyze ? template.analyze(task, context) : null,
      recommendations: template.recommend ? template.recommend(task, context) : [],
      implementation: template.implement ? template.implement(task, context) : null,
      context
    };
    
    return processed;
  }
  
  /**
   * Classify task type
   */
  classifyTask(task) {
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('implement') || taskStr.includes('create') || taskStr.includes('build')) {
      return 'implementation';
    }
    
    if (taskStr.includes('review') || taskStr.includes('check') || taskStr.includes('validate')) {
      return 'review';
    }
    
    return 'analysis';
  }
  
  /**
   * Cache management
   */
  getCached(task) {
    const key = this.getCacheKey(task);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }
    
    return null;
  }
  
  setCached(task, result) {
    const key = this.getCacheKey(task);
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  getCacheKey(task) {
    return JSON.stringify(task).substring(0, 100);
  }
  
  /**
   * Update metrics
   */
  updateMetrics(success, responseTime) {
    const total = this.metrics.tasksProcessed;
    const successCount = Math.round(this.metrics.successRate * (total - 1)) + (success ? 1 : 0);
    
    this.metrics.successRate = successCount / total;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
  }
  
  /**
   * Get default templates
   */
  getDefaultAnalysisTemplate() {
    return {
      analyze: (task, context) => ({
        summary: \`Analysis of: \${task.description || task}\`,
        components: this.identifyComponents(task),
        complexity: this.assessComplexity(task),
        risks: this.identifyRisks(task)
      }),
      recommend: (task, context) => [
        'Consider breaking down into smaller tasks',
        'Review existing implementations',
        'Validate requirements with stakeholders'
      ]
    };
  }
  
  getDefaultImplementationTemplate() {
    return {
      analyze: (task, context) => ({
        requirements: this.extractRequirements(task),
        dependencies: this.identifyDependencies(task),
        approach: this.determineApproach(task)
      }),
      implement: (task, context) => ({
        steps: this.generateImplementationSteps(task),
        code: this.generateCodeTemplate(task),
        tests: this.generateTestTemplate(task)
      })
    };
  }
  
  getDefaultReviewTemplate() {
    return {
      analyze: (task, context) => ({
        scope: this.determineReviewScope(task),
        criteria: this.getReviewCriteria(task),
        priority: this.assessPriority(task)
      }),
      recommend: (task, context) => this.generateReviewRecommendations(task)
    };
  }
  
  // Helper methods for templates
  identifyComponents(task) {
    return ['core', 'ui', 'api', 'database'].filter(c => 
      JSON.stringify(task).toLowerCase().includes(c)
    );
  }
  
  assessComplexity(task) {
    const factors = JSON.stringify(task).length;
    return factors > 500 ? 'high' : factors > 200 ? 'medium' : 'low';
  }
  
  identifyRisks(task) {
    const risks = [];
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('security')) risks.push('Security considerations required');
    if (taskStr.includes('performance')) risks.push('Performance optimization needed');
    if (taskStr.includes('scale')) risks.push('Scalability concerns');
    
    return risks;
  }
  
  extractRequirements(task) {
    return {
      functional: [],
      nonFunctional: [],
      constraints: []
    };
  }
  
  identifyDependencies(task) {
    return [];
  }
  
  determineApproach(task) {
    return 'iterative';
  }
  
  generateImplementationSteps(task) {
    return [
      'Analyze requirements',
      'Design solution',
      'Implement core functionality',
      'Add error handling',
      'Write tests',
      'Document'
    ];
  }
  
  generateCodeTemplate(task) {
    return \`// Implementation for: \${task.description || task}
// TODO: Add implementation
class Implementation {
  constructor() {
    // Initialize
  }
  
  async execute() {
    // Main logic
  }
}

module.exports = Implementation;\`;
  }
  
  generateTestTemplate(task) {
    return \`// Tests for: \${task.description || task}
describe('Implementation', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});\`;
  }
  
  determineReviewScope(task) {
    return 'comprehensive';
  }
  
  getReviewCriteria(task) {
    return ['correctness', 'performance', 'security', 'maintainability'];
  }
  
  assessPriority(task) {
    return 'medium';
  }
  
  generateReviewRecommendations(task) {
    return ['Review implementation', 'Check edge cases', 'Validate performance'];
  }
  
  /**
   * Configure API (for future adopters)
   */
  configureAPI(config) {
    this.apiConfig = {
      ...this.apiConfig,
      ...config
    };
    
    this.apiConfig.ready = !!this.apiConfig.apiKey && this.apiConfig.apiKey !== 'pending';
    this.config.offlineMode = !this.apiConfig.ready;
    
    logger.info(\`API configured for \${this.name}: \${this.apiConfig.ready ? 'ready' : 'pending'}\`);
    
    return this.apiConfig.ready;
  }
  
  /**
   * Get specialist info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      department: this.department,
      status: this.status,
      mode: this.config.offlineMode ? 'offline' : 'online',
      apiReady: this.apiConfig.ready,
      metrics: this.metrics,
      capabilities: this.capabilities,
      expertise: this.expertise
    };
  }
}

module.exports = UnifiedSpecialistBase;
`;

/**
 * Write the unified base class
 */
async function createUnifiedBase() {
  const filePath = path.join(__dirname, 'unified-specialist-base.js');
  await fs.writeFile(filePath, UNIFIED_BASE_TEMPLATE);
  logger.info('🏁 Created unified specialist base class');
  return filePath;
}

/**
 * Update specialist to use unified base
 */
async function updateSpecialist(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Check if already migrated
    if (content.includes('UnifiedSpecialistBase')) {
      return { status: 'already_migrated', filePath };
    }
    
    // Update extends clause
    MIGRATION_CONFIG.baseClasses.old.forEach(oldBase => {
      const regex = new RegExp(`extends\\s+${oldBase}`, 'g');
      content = content.replace(regex, 'extends UnifiedSpecialistBase');
    });
    
    // Update imports
    content = content.replace(
      /require\(['"]\.\.\/specialist-(base|agent|operational-base|base-unified)['"]\)/g,
      "require('./unified-specialist-base')"
    );
    
    content = content.replace(
      /require\(['"]\.\/(specialist-)?(base|agent|operational-base|base-unified)['"]\)/g,
      "require('./unified-specialist-base')"
    );
    
    // Add unified base import if not present
    if (!content.includes('unified-specialist-base')) {
      const requireRegex = /const\s+{\s*.*?\s*}\s*=\s*require\(/;
      const firstRequire = content.match(requireRegex);
      
      if (firstRequire) {
        const importLine = "const UnifiedSpecialistBase = require('./unified-specialist-base');\n";
        content = importLine + content;
      }
    }
    
    // Save if changed
    if (content !== originalContent) {
      if (MIGRATION_CONFIG.backup) {
        await fs.writeFile(`${filePath}.backup`, originalContent);
      }
      
      if (!MIGRATION_CONFIG.dryRun) {
        await fs.writeFile(filePath, content);
      }
      
      return { status: 'migrated', filePath };
    }
    
    return { status: 'no_changes', filePath };
    
  } catch (error) {
    return { status: 'error', filePath, error: error.message };
  }
}

/**
 * Migrate all specialists in a directory
 */
async function migrateDirectory(dirPath) {
  const results = {
    migrated: [],
    already_migrated: [],
    no_changes: [],
    errors: []
  };
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively migrate subdirectories
        const subResults = await migrateDirectory(fullPath);
        results.migrated.push(...subResults.migrated);
        results.already_migrated.push(...subResults.already_migrated);
        results.no_changes.push(...subResults.no_changes);
        results.errors.push(...subResults.errors);
      } else if (entry.name.endsWith('.js') && !entry.name.includes('backup')) {
        const result = await updateSpecialist(fullPath);
        results[result.status === 'migrated' ? 'migrated' : 
                result.status === 'already_migrated' ? 'already_migrated' :
                result.status === 'error' ? 'errors' : 'no_changes'].push(result);
      }
    }
  } catch (error) {
    logger.error(`Error migrating directory ${dirPath}:`, error);
  }
  
  return results;
}

/**
 * Main migration function
 */
async function runMigration() {
  logger.info('🟢 Starting specialist migration to unified base class');
  
  const startTime = Date.now();
  const allResults = {
    migrated: [],
    already_migrated: [],
    no_changes: [],
    errors: []
  };
  
  // Create unified base class
  await createUnifiedBase();
  
  // Migrate all specialist directories
  for (const dir of MIGRATION_CONFIG.directories) {
    logger.info(`📁 Migrating ${dir}...`);
    const results = await migrateDirectory(dir);
    
    allResults.migrated.push(...results.migrated);
    allResults.already_migrated.push(...results.already_migrated);
    allResults.no_changes.push(...results.no_changes);
    allResults.errors.push(...results.errors);
  }
  
  // Generate report
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const report = `
=================================================
       SPECIALIST MIGRATION REPORT
=================================================

Migration completed in ${duration} seconds

🏁 Successfully migrated: ${allResults.migrated.length}
📌 Already migrated: ${allResults.already_migrated.length}
🔴 No changes needed: ${allResults.no_changes.length}
🔴 Errors: ${allResults.errors.length}

${allResults.errors.length > 0 ? `
Errors:
${allResults.errors.map(e => `  - ${e.filePath}: ${e.error}`).join('\n')}
` : ''}

Total specialists processed: ${
  allResults.migrated.length + 
  allResults.already_migrated.length + 
  allResults.no_changes.length + 
  allResults.errors.length
}

=================================================
`;
  
  console.log(report);
  
  // Save report
  await fs.writeFile(
    `specialist-migration-report-${Date.now()}.txt`,
    report
  );
  
  return allResults;
}

// Export functions
module.exports = {
  createUnifiedBase,
  updateSpecialist,
  migrateDirectory,
  runMigration
};

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(results => {
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}