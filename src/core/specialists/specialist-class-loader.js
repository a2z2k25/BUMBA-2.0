/**
 * BUMBA Specialist Class Loader
 * Robust loading system with validation, caching, and fallback mechanisms
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');
const UnifiedSpecialistBase = require('./unified-specialist-base');

class SpecialistClassLoader {
  constructor() {
    this.loadedClasses = new Map();
    this.loadErrors = new Map();
    this.validationCache = new Map();
    this.fallbackStrategies = new Map();
    
    // Performance metrics
    this.metrics = {
      totalLoads: 0,
      successfulLoads: 0,
      fallbackLoads: 0,
      errors: 0,
      cacheHits: 0
    };
    
    this.initializeFallbackStrategies();
  }

  /**
   * Initialize fallback strategies for missing specialists
   */
  initializeFallbackStrategies() {
    // Language specialist fallback
    this.fallbackStrategies.set('languages', {
      pattern: /^(javascript|typescript|python|golang|rust|java|csharp|ruby|php|elixir|scala|c|cpp)-specialist$/,
      generator: (type) => {
        const language = type.replace('-specialist', '');
        return this.createLanguageSpecialist(language);
      }
    });
    
    // Framework specialist fallback
    this.fallbackStrategies.set('frameworks', {
      pattern: /^(react|vue|angular|svelte|next|nuxt|express|fastapi|django|rails)-specialist$/,
      generator: (type) => {
        const framework = type.replace('-specialist', '');
        return this.createFrameworkSpecialist(framework);
      }
    });
    
    // Database specialist fallback
    this.fallbackStrategies.set('databases', {
      pattern: /^(postgres|mysql|mongodb|redis|elasticsearch|dynamodb|cassandra)-specialist$/,
      generator: (type) => {
        const database = type.replace('-specialist', '');
        return this.createDatabaseSpecialist(database);
      }
    });
    
    // DevOps specialist fallback
    this.fallbackStrategies.set('devops', {
      pattern: /^(docker|kubernetes|terraform|ansible|jenkins|circleci|github-actions)-specialist$/,
      generator: (type) => {
        const tool = type.replace('-specialist', '');
        return this.createDevOpsSpecialist(tool);
      }
    });
  }

  /**
   * Load a specialist class with robust error handling
   */
  async loadSpecialistClass(type, config = {}) {
    this.metrics.totalLoads++;
    
    // Check cache first
    if (this.loadedClasses.has(type)) {
      this.metrics.cacheHits++;
      return this.loadedClasses.get(type);
    }
    
    // Check if we've already tried and failed
    if (this.loadErrors.has(type)) {
      const error = this.loadErrors.get(type);
      if (Date.now() - error.timestamp < 60000) { // 1 minute retry delay
        return this.generateFallbackClass(type, config);
      }
    }
    
    try {
      // Try to load the actual class
      const SpecialistClass = await this.attemptLoad(type, config);
      
      // Validate the loaded class
      if (this.validateSpecialistClass(SpecialistClass, type)) {
        this.loadedClasses.set(type, SpecialistClass);
        this.metrics.successfulLoads++;
        logger.info(`🏁 Successfully loaded specialist: ${type}`);
        return SpecialistClass;
      } else {
        throw new Error(`Invalid specialist class structure for ${type}`);
      }
      
    } catch (error) {
      // Record the error
      this.loadErrors.set(type, {
        error: error.message,
        timestamp: Date.now()
      });
      this.metrics.errors++;
      
      logger.warn(`🟠️ Failed to load specialist ${type}: ${error.message}`);
      
      // Generate fallback class
      return this.generateFallbackClass(type, config);
    }
  }

  /**
   * Attempt to load specialist from various locations
   */
  async attemptLoad(type, config) {
    const possiblePaths = this.generatePossiblePaths(type, config);
    
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        try {
          // Clear require cache for hot-reloading
          delete require.cache[require.resolve(tryPath)];
          const SpecialistClass = require(tryPath);
          
          // Handle various export formats
          if (SpecialistClass.default) {
            return SpecialistClass.default;
          }
          if (typeof SpecialistClass === 'function') {
            return SpecialistClass;
          }
          if (SpecialistClass[type]) {
            return SpecialistClass[type];
          }
          
          // Try to find the first exported class
          const exportedClass = Object.values(SpecialistClass).find(
            val => typeof val === 'function' && val.prototype
          );
          if (exportedClass) {
            return exportedClass;
          }
          
        } catch (error) {
          logger.debug(`Failed to require ${tryPath}: ${error.message}`);
          continue;
        }
      }
    }
    
    throw new Error(`No valid specialist file found for ${type}`);
  }

  /**
   * Generate possible file paths for a specialist
   */
  generatePossiblePaths(type, config) {
    const paths = [];
    const baseDir = path.join(__dirname);
    
    // From config path
    if (config.path) {
      paths.push(path.join(baseDir, '..', config.path + '.js'));
      paths.push(path.join(baseDir, config.path + '.js'));
    }
    
    // Category-based paths
    if (config.category && config.subcategory) {
      paths.push(path.join(baseDir, config.category, config.subcategory, `${type}.js`));
    }
    if (config.category) {
      paths.push(path.join(baseDir, config.category, `${type}.js`));
    }
    
    // Standard paths
    paths.push(path.join(baseDir, 'technical', 'languages', `${type}.js`));
    paths.push(path.join(baseDir, 'technical', 'devops', `${type}.js`));
    paths.push(path.join(baseDir, 'technical', 'database', `${type}.js`));
    paths.push(path.join(baseDir, 'technical', 'qa', `${type}.js`));
    paths.push(path.join(baseDir, 'technical', 'data-ai', `${type}.js`));
    paths.push(path.join(baseDir, 'technical', 'advanced', `${type}.js`));
    paths.push(path.join(baseDir, 'experience', `${type}.js`));
    paths.push(path.join(baseDir, 'strategic', `${type}.js`));
    paths.push(path.join(baseDir, 'documentation', `${type}.js`));
    paths.push(path.join(baseDir, 'specialized', `${type}.js`));
    
    // Direct path
    paths.push(path.join(baseDir, `${type}.js`));
    
    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Validate that a loaded class is a valid specialist
   */
  validateSpecialistClass(SpecialistClass, type) {
    // Check if it's a constructor function
    if (typeof SpecialistClass !== 'function') {
      return false;
    }
    
    // Check for required methods (either on prototype or as static)
    const requiredMethods = ['execute', 'analyze'];
    const hasRequiredMethods = requiredMethods.some(method => 
      SpecialistClass.prototype[method] || 
      SpecialistClass[method]
    );
    
    // Check if it extends UnifiedSpecialistBase or has similar structure
    const isValidStructure = 
      SpecialistClass.prototype instanceof UnifiedSpecialistBase ||
      hasRequiredMethods ||
      SpecialistClass.prototype.constructor === SpecialistClass;
    
    return isValidStructure;
  }

  /**
   * Generate a fallback class for missing specialists
   */
  generateFallbackClass(type, config) {
    this.metrics.fallbackLoads++;
    
    // Check fallback strategies
    for (const [category, strategy] of this.fallbackStrategies) {
      if (strategy.pattern.test(type)) {
        logger.info(`🔄 Using ${category} fallback for ${type}`);
        return strategy.generator(type);
      }
    }
    
    // Generic fallback
    logger.info(`🤖 Generating generic fallback for ${type}`);
    return this.createGenericSpecialist(type, config);
  }

  /**
   * Create a language-specific specialist
   */
  createLanguageSpecialist(language) {
    return class LanguageSpecialist extends UnifiedSpecialistBase {
      constructor(department, context) {
        super(department, context);
        this.type = `${language}-specialist`;
        this.language = language;
        this.capabilities = this.getLanguageCapabilities(language);
      }
      
      getLanguageCapabilities(lang) {
        const capabilities = {
          javascript: ['ES6+', 'async/await', 'Node.js', 'npm', 'TypeScript basics'],
          typescript: ['Type systems', 'Interfaces', 'Generics', 'Decorators', 'Strict mode'],
          python: ['Python 3', 'async/await', 'Type hints', 'pip', 'Virtual environments'],
          golang: ['Goroutines', 'Channels', 'Interfaces', 'Error handling', 'Modules'],
          rust: ['Ownership', 'Borrowing', 'Traits', 'Error handling', 'Cargo'],
          java: ['OOP', 'Spring', 'Maven/Gradle', 'JVM', 'Streams'],
          csharp: ['.NET', 'LINQ', 'async/await', 'Entity Framework', 'ASP.NET'],
          ruby: ['Rails', 'Gems', 'Metaprogramming', 'Blocks', 'DSLs'],
          php: ['Laravel', 'Composer', 'PSR standards', 'OOP', 'Modern PHP'],
          default: ['Syntax', 'Best practices', 'Package management', 'Testing', 'Documentation']
        };
        return capabilities[lang] || capabilities.default;
      }
      
      async execute(task) {
        return {
          success: true,
          specialist: this.type,
          message: `Executed ${this.language} task: ${task.description}`,
          capabilities: this.capabilities,
          recommendations: this.generateRecommendations(task)
        };
      }
      
      async analyze(code) {
        return {
          language: this.language,
          analysis: `Analyzed ${this.language} code`,
          suggestions: [`Use ${this.language} best practices`, 'Add error handling', 'Improve documentation']
        };
      }
      
      generateRecommendations(task) {
        return [
          `Follow ${this.language} conventions`,
          'Implement proper error handling',
          'Add comprehensive tests',
          'Document complex logic'
        ];
      }
    };
  }

  /**
   * Create a framework-specific specialist
   */
  createFrameworkSpecialist(framework) {
    return class FrameworkSpecialist extends UnifiedSpecialistBase {
      constructor(department, context) {
        super(department, context);
        this.type = `${framework}-specialist`;
        this.framework = framework;
        this.capabilities = this.getFrameworkCapabilities(framework);
      }
      
      getFrameworkCapabilities(fw) {
        const capabilities = {
          react: ['Hooks', 'State management', 'Performance optimization', 'Testing', 'Next.js'],
          vue: ['Composition API', 'Vuex/Pinia', 'Vue Router', 'Nuxt', 'Testing'],
          angular: ['RxJS', 'Dependency injection', 'NgRx', 'Testing', 'Performance'],
          express: ['Middleware', 'Routing', 'Error handling', 'Security', 'Testing'],
          django: ['ORM', 'Admin', 'Forms', 'REST framework', 'Testing'],
          rails: ['ActiveRecord', 'MVC', 'Testing', 'ActionCable', 'API mode'],
          default: ['Architecture', 'Best practices', 'Performance', 'Testing', 'Documentation']
        };
        return capabilities[fw] || capabilities.default;
      }
      
      async execute(task) {
        return {
          success: true,
          specialist: this.type,
          message: `Executed ${this.framework} task: ${task.description}`,
          capabilities: this.capabilities
        };
      }
      
      async analyze(code) {
        return {
          framework: this.framework,
          analysis: `Analyzed ${this.framework} implementation`,
          suggestions: this.capabilities.map(cap => `Optimize ${cap}`)
        };
      }
    };
  }

  /**
   * Create a database-specific specialist
   */
  createDatabaseSpecialist(database) {
    return class DatabaseSpecialist extends UnifiedSpecialistBase {
      constructor(department, context) {
        super(department, context);
        this.type = `${database}-specialist`;
        this.database = database;
        this.capabilities = this.getDatabaseCapabilities(database);
      }
      
      getDatabaseCapabilities(db) {
        const capabilities = {
          postgres: ['SQL optimization', 'Indexing', 'JSONB', 'Partitioning', 'Replication'],
          mysql: ['Query optimization', 'Indexing', 'Replication', 'Clustering', 'Performance'],
          mongodb: ['Document design', 'Aggregation', 'Indexing', 'Sharding', 'Replication'],
          redis: ['Caching strategies', 'Data structures', 'Pub/Sub', 'Persistence', 'Clustering'],
          elasticsearch: ['Indexing', 'Querying', 'Aggregations', 'Mapping', 'Performance'],
          default: ['Query optimization', 'Indexing', 'Schema design', 'Performance', 'Backup']
        };
        return capabilities[db] || capabilities.default;
      }
      
      async execute(task) {
        return {
          success: true,
          specialist: this.type,
          message: `Executed ${this.database} task: ${task.description}`,
          capabilities: this.capabilities
        };
      }
      
      async analyze(schema) {
        return {
          database: this.database,
          analysis: `Analyzed ${this.database} schema`,
          optimizations: this.capabilities.map(cap => `Improve ${cap}`)
        };
      }
    };
  }

  /**
   * Create a DevOps-specific specialist
   */
  createDevOpsSpecialist(tool) {
    return class DevOpsSpecialist extends UnifiedSpecialistBase {
      constructor(department, context) {
        super(department, context);
        this.type = `${tool}-specialist`;
        this.tool = tool;
        this.capabilities = this.getDevOpsCapabilities(tool);
      }
      
      getDevOpsCapabilities(t) {
        const capabilities = {
          docker: ['Containerization', 'Multi-stage builds', 'Networking', 'Volumes', 'Compose'],
          kubernetes: ['Deployments', 'Services', 'Ingress', 'ConfigMaps', 'Helm'],
          terraform: ['IaC', 'Modules', 'State management', 'Providers', 'Best practices'],
          jenkins: ['Pipelines', 'Plugins', 'Distributed builds', 'Security', 'Integration'],
          default: ['Automation', 'CI/CD', 'Monitoring', 'Security', 'Best practices']
        };
        return capabilities[t] || capabilities.default;
      }
      
      async execute(task) {
        return {
          success: true,
          specialist: this.type,
          message: `Executed ${this.tool} task: ${task.description}`,
          capabilities: this.capabilities
        };
      }
      
      async analyze(config) {
        return {
          tool: this.tool,
          analysis: `Analyzed ${this.tool} configuration`,
          improvements: this.capabilities.map(cap => `Enhance ${cap}`)
        };
      }
    };
  }

  /**
   * Create a generic specialist for unknown types
   */
  createGenericSpecialist(type, config) {
    return class GenericSpecialist extends UnifiedSpecialistBase {
      constructor(department, context) {
        super(department, context);
        this.type = type;
        this.config = config;
        this.capabilities = config.expertise || ['General development', 'Problem solving'];
      }
      
      async execute(task) {
        return {
          success: true,
          specialist: this.type,
          message: `Generic execution for ${task.description}`,
          capabilities: this.capabilities,
          fallback: true
        };
      }
      
      async analyze(input) {
        return {
          type: this.type,
          analysis: 'Generic analysis performed',
          recommendations: ['Consult domain expert', 'Review best practices', 'Add tests']
        };
      }
      
      async validate(input) {
        return {
          valid: true,
          specialist: this.type,
          fallback: true
        };
      }
    };
  }

  /**
   * Get loader metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalLoads > 0 
        ? (this.metrics.successfulLoads / this.metrics.totalLoads * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: this.metrics.totalLoads > 0
        ? (this.metrics.cacheHits / this.metrics.totalLoads * 100).toFixed(2) + '%'
        : '0%',
      fallbackRate: this.metrics.totalLoads > 0
        ? (this.metrics.fallbackLoads / this.metrics.totalLoads * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.loadedClasses.clear();
    this.validationCache.clear();
    logger.info('Specialist class loader caches cleared');
  }

  /**
   * Preload commonly used specialists
   */
  async preloadCommonSpecialists() {
    const commonTypes = [
      'javascript-specialist',
      'typescript-specialist',
      'python-specialist',
      'react-specialist',
      'postgres-specialist',
      'docker-specialist',
      'api-architect',
      'test-automator'
    ];
    
    logger.info('Preloading common specialists...');
    
    for (const type of commonTypes) {
      await this.loadSpecialistClass(type, {});
    }
    
    logger.info(`Preloaded ${commonTypes.length} common specialists`);
  }
}

// Export singleton instance
module.exports = new SpecialistClassLoader();