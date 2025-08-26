/**
 * BUMBA Simplified Initialization Manager
 * Fixes race conditions and simplifies the startup sequence
 * Ensures deterministic, sequential initialization with proper error handling
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedErrorManager } = require('../error-handling/unified-error-manager');

/**
 * Initialization phases and their dependencies
 */
const INIT_PHASES = {
  // Phase 1: Core Infrastructure
  core: {
    priority: 1,
    components: [
      'logging',
      'errorHandling',
      'configuration',
      'hooks'
    ],
    dependencies: []
  },
  
  // Phase 2: Resource Management
  resources: {
    priority: 2,
    components: [
      'resourceManager',
      'cacheSystem',
      'memoryManager'
    ],
    dependencies: ['core']
  },
  
  // Phase 3: Integrations
  integrations: {
    priority: 3,
    components: [
      'integrationManager',
      'databases',
      'externalServices'
    ],
    dependencies: ['core', 'resources']
  },
  
  // Phase 4: Departments & Specialists
  departments: {
    priority: 4,
    components: [
      'productStrategist',
      'designEngineer',
      'backendEngineer',
      'specialists'
    ],
    dependencies: ['core', 'resources']
  },
  
  // Phase 5: Coordination & Orchestration
  coordination: {
    priority: 5,
    components: [
      'coordinationHub',
      'orchestrationSystem',
      'territoryManager',
      'conflictResolution'
    ],
    dependencies: ['departments']
  },
  
  // Phase 6: Command & Routing
  routing: {
    priority: 6,
    components: [
      'commandHandler',
      'router',
      'commandImplementations'
    ],
    dependencies: ['departments', 'coordination']
  },
  
  // Phase 7: Monitoring & Health
  monitoring: {
    priority: 7,
    components: [
      'healthMonitor',
      'performanceMonitor',
      'statusLine',
      'whispers'
    ],
    dependencies: ['core', 'routing']
  },
  
  // Phase 8: Optional Features
  optional: {
    priority: 8,
    components: [
      'consciousness',
      'learning',
      'notionSync',
      'executiveMode'
    ],
    dependencies: ['routing', 'monitoring'],
    optional: true
  }
};

/**
 * Component initialization registry
 */
const COMPONENT_INITIALIZERS = {
  // Core components
  logging: async (framework) => {
    // Logging is usually already initialized
    return { status: 'ready', component: 'logging' };
  },
  
  errorHandling: async (framework) => {
    const { getInstance } = require('../error-handling/unified-error-manager');
    framework.errorManager = getInstance();
    return { status: 'ready', component: 'errorHandling' };
  },
  
  configuration: async (framework) => {
    // Load configuration
    const config = framework.config || {};
    framework.config = config;
    return { status: 'ready', component: 'configuration' };
  },
  
  hooks: async (framework) => {
    if (!framework.hooks) {
      const { UnifiedHookSystem } = require('../unified-hook-system');
      framework.hooks = new UnifiedHookSystem();
    }
    return { status: 'ready', component: 'hooks' };
  },
  
  // Resource management
  resourceManager: async (framework) => {
    if (!framework.resourceManager) {
      const { ResourceManager } = require('../resource-management/resource-manager');
      framework.resourceManager = new ResourceManager();
    }
    return { status: 'ready', component: 'resourceManager' };
  },
  
  cacheSystem: async (framework) => {
    if (!framework.cache) {
      framework.cache = new Map();
    }
    return { status: 'ready', component: 'cacheSystem' };
  },
  
  memoryManager: async (framework) => {
    if (!framework.memoryManager) {
      const { MemoryManager } = require('../resource-management/memory-manager');
      framework.memoryManager = new MemoryManager();
    }
    return { status: 'ready', component: 'memoryManager' };
  },
  
  // Integrations
  integrationManager: async (framework) => {
    const { getInstance } = require('../integrations/unified-integration-manager');
    framework.integrationManager = getInstance({ autoLoad: false });
    return { status: 'ready', component: 'integrationManager' };
  },
  
  databases: async (framework) => {
    // Initialize database connections (without actual connection)
    framework.databases = {
      postgres: null,
      mongodb: null,
      redis: null
    };
    return { status: 'ready', component: 'databases' };
  },
  
  externalServices: async (framework) => {
    // Placeholder for external services
    framework.externalServices = {};
    return { status: 'ready', component: 'externalServices' };
  },
  
  // Departments
  productStrategist: async (framework) => {
    if (!framework.departments.has('product-strategist')) {
      const ProductStrategist = require('../departments/product-strategist-manager');
      framework.departments.set('product-strategist', new ProductStrategist());
    }
    return { status: 'ready', component: 'productStrategist' };
  },
  
  designEngineer: async (framework) => {
    if (!framework.departments.has('design-engineer')) {
      const DesignEngineer = require('../departments/design-engineer-manager');
      framework.departments.set('design-engineer', new DesignEngineer());
    }
    return { status: 'ready', component: 'designEngineer' };
  },
  
  backendEngineer: async (framework) => {
    if (!framework.departments.has('backend-engineer')) {
      const BackendEngineer = require('../departments/backend-engineer-manager');
      framework.departments.set('backend-engineer', new BackendEngineer());
    }
    return { status: 'ready', component: 'backendEngineer' };
  },
  
  specialists: async (framework) => {
    // Specialists are already migrated to unified base
    framework.specialistsReady = true;
    return { status: 'ready', component: 'specialists' };
  },
  
  // Coordination
  coordinationHub: async (framework) => {
    if (!framework.coordinationHub) {
      const { CoordinationHub } = require('../coordination/department-protocols');
      framework.coordinationHub = new CoordinationHub();
      await framework.coordinationHub.initialize();
    }
    return { status: 'ready', component: 'coordinationHub' };
  },
  
  orchestrationSystem: async (framework) => {
    // Optional orchestration
    framework.orchestrationEnabled = false;
    return { status: 'ready', component: 'orchestrationSystem' };
  },
  
  territoryManager: async (framework) => {
    // Territory management for file operations
    if (framework.coordinationHub) {
      framework.territoryManager = framework.coordinationHub.territoryManager;
    }
    return { status: 'ready', component: 'territoryManager' };
  },
  
  conflictResolution: async (framework) => {
    // Conflict resolution system
    if (framework.coordinationHub) {
      framework.conflictResolution = framework.coordinationHub.conflictResolution;
    }
    return { status: 'ready', component: 'conflictResolution' };
  },
  
  // Routing
  commandHandler: async (framework) => {
    if (!framework.commandHandler) {
      const BumbaCommandHandler = require('../command-handler');
      framework.commandHandler = new BumbaCommandHandler();
    }
    return { status: 'ready', component: 'commandHandler' };
  },
  
  router: async (framework) => {
    if (!framework.router) {
      const IntelligentRouter = require('../routing/intelligent-router');
      framework.router = new IntelligentRouter();
    }
    return { status: 'ready', component: 'router' };
  },
  
  commandImplementations: async (framework) => {
    // Command implementations are loaded
    const { getInstance } = require('../command-implementations');
    framework.commandImplementations = getInstance();
    return { status: 'ready', component: 'commandImplementations' };
  },
  
  // Monitoring
  healthMonitor: async (framework) => {
    if (!framework.healthMonitor) {
      const { HealthMonitor } = require('../monitoring/health-monitor');
      framework.healthMonitor = new HealthMonitor();
    }
    return { status: 'ready', component: 'healthMonitor' };
  },
  
  performanceMonitor: async (framework) => {
    if (!framework.performanceMonitor) {
      const { PerformanceMetrics } = require('../monitoring/performance-metrics');
      framework.performanceMonitor = new PerformanceMetrics();
    }
    return { status: 'ready', component: 'performanceMonitor' };
  },
  
  statusLine: async (framework) => {
    // Status line is optional
    framework.statusLineEnabled = false;
    return { status: 'ready', component: 'statusLine' };
  },
  
  whispers: async (framework) => {
    // Whispers are optional
    framework.whispersEnabled = false;
    return { status: 'ready', component: 'whispers' };
  },
  
  // Optional features
  consciousness: async (framework) => {
    // Consciousness layer is optional
    framework.consciousnessEnabled = false;
    return { status: 'optional', component: 'consciousness' };
  },
  
  learning: async (framework) => {
    // Learning system is optional
    framework.learningEnabled = false;
    return { status: 'optional', component: 'learning' };
  },
  
  notionSync: async (framework) => {
    // Notion sync is optional
    framework.notionSyncEnabled = false;
    return { status: 'optional', component: 'notionSync' };
  },
  
  executiveMode: async (framework) => {
    // Executive mode is optional
    framework.executiveModeEnabled = false;
    return { status: 'optional', component: 'executiveMode' };
  }
};

/**
 * Simplified Initialization Manager
 */
class SimplifiedInitManager extends EventEmitter {
  constructor(framework, options = {}) {
    super();
    
    this.framework = framework;
    this.options = {
      timeout: options.timeout || 30000, // 30 seconds total
      phaseTimeout: options.phaseTimeout || 5000, // 5 seconds per phase
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000,
      skipOptional: options.skipOptional || false,
      parallel: options.parallel || false, // Sequential by default to avoid races
      ...options
    };
    
    this.errorManager = new UnifiedErrorManager();
    this.initState = {
      phases: new Map(),
      components: new Map(),
      startTime: null,
      endTime: null,
      duration: null,
      status: 'pending'
    };
  }
  
  /**
   * Main initialization method
   */
  async initialize() {
    this.initState.startTime = Date.now();
    this.initState.status = 'initializing';
    
    logger.info('🟢 Starting simplified initialization sequence');
    
    try {
      // Sort phases by priority
      const sortedPhases = Object.entries(INIT_PHASES)
        .sort((a, b) => a[1].priority - b[1].priority);
      
      // Initialize each phase
      for (const [phaseName, phaseConfig] of sortedPhases) {
        if (phaseConfig.optional && this.options.skipOptional) {
          logger.info(`⏭️ Skipping optional phase: ${phaseName}`);
          continue;
        }
        
        await this.initializePhase(phaseName, phaseConfig);
      }
      
      // Final validation
      await this.validateInitialization();
      
      this.initState.endTime = Date.now();
      this.initState.duration = this.initState.endTime - this.initState.startTime;
      this.initState.status = 'completed';
      
      logger.info(`🏁 Initialization completed in ${this.initState.duration}ms`);
      
      this.emit('initialized', this.getInitReport());
      
      return this.getInitReport();
      
    } catch (error) {
      this.initState.status = 'failed';
      
      const handled = await this.errorManager.handleError(error, {
        component: 'initialization',
        state: this.initState
      });
      
      if (!handled.recovered) {
        logger.error('🔴 Initialization failed:', handled.error);
        throw handled.error;
      }
      
      return this.getInitReport();
    }
  }
  
  /**
   * Initialize a specific phase
   */
  async initializePhase(phaseName, phaseConfig) {
    logger.info(`📦 Initializing phase: ${phaseName}`);
    
    const phaseStart = Date.now();
    const phaseState = {
      name: phaseName,
      status: 'initializing',
      components: [],
      errors: [],
      startTime: phaseStart
    };
    
    this.initState.phases.set(phaseName, phaseState);
    
    try {
      // Check dependencies
      await this.checkDependencies(phaseConfig.dependencies);
      
      // Initialize components in this phase
      if (this.options.parallel && phaseConfig.components.length > 1) {
        // Parallel initialization within phase
        await this.initializeComponentsParallel(phaseConfig.components, phaseState);
      } else {
        // Sequential initialization (default)
        await this.initializeComponentsSequential(phaseConfig.components, phaseState);
      }
      
      phaseState.endTime = Date.now();
      phaseState.duration = phaseState.endTime - phaseState.startTime;
      phaseState.status = 'completed';
      
      logger.info(`🏁 Phase ${phaseName} completed in ${phaseState.duration}ms`);
      
      this.emit('phase:completed', phaseState);
      
    } catch (error) {
      phaseState.status = 'failed';
      phaseState.error = error;
      
      if (!phaseConfig.optional) {
        throw error;
      }
      
      logger.warn(`🟠️ Optional phase ${phaseName} failed:`, error.message);
    }
  }
  
  /**
   * Check phase dependencies
   */
  async checkDependencies(dependencies) {
    for (const dep of dependencies) {
      const depPhase = this.initState.phases.get(dep);
      
      if (!depPhase || depPhase.status !== 'completed') {
        throw new Error(`Dependency '${dep}' not satisfied`);
      }
    }
  }
  
  /**
   * Initialize components sequentially
   */
  async initializeComponentsSequential(components, phaseState) {
    for (const componentName of components) {
      await this.initializeComponent(componentName, phaseState);
    }
  }
  
  /**
   * Initialize components in parallel
   */
  async initializeComponentsParallel(components, phaseState) {
    const promises = components.map(componentName => 
      this.initializeComponent(componentName, phaseState)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      const errors = failures.map(f => f.reason);
      throw new Error(`Failed to initialize components: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Initialize a single component
   */
  async initializeComponent(componentName, phaseState) {
    const componentState = {
      name: componentName,
      status: 'initializing',
      startTime: Date.now(),
      attempts: 0
    };
    
    this.initState.components.set(componentName, componentState);
    
    try {
      // Get initializer
      const initializer = COMPONENT_INITIALIZERS[componentName];
      
      if (!initializer) {
        logger.warn(`🟠️ No initializer for component: ${componentName}`);
        componentState.status = 'skipped';
        return;
      }
      
      // Initialize with retry
      let lastError;
      for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
        try {
          componentState.attempts++;
          
          const result = await this.withTimeout(
            initializer(this.framework),
            this.options.phaseTimeout,
            `Component ${componentName} initialization timeout`
          );
          
          componentState.result = result;
          componentState.status = result.status || 'ready';
          componentState.endTime = Date.now();
          componentState.duration = componentState.endTime - componentState.startTime;
          
          phaseState.components.push(componentName);
          
          logger.debug(`🏁 Component ${componentName} initialized`);
          
          this.emit('component:initialized', componentState);
          
          return result;
          
        } catch (error) {
          lastError = error;
          
          if (attempt < this.options.retryAttempts) {
            logger.warn(`🟠️ Retrying ${componentName} (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
          }
        }
      }
      
      throw lastError;
      
    } catch (error) {
      componentState.status = 'failed';
      componentState.error = error;
      phaseState.errors.push({ component: componentName, error });
      
      const handled = await this.errorManager.handleError(error, {
        component: componentName,
        phase: phaseState.name
      });
      
      if (!handled.recovered) {
        throw error;
      }
      
      componentState.status = 'recovered';
    }
  }
  
  /**
   * Execute with timeout
   */
  async withTimeout(promise, timeout, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(message)), timeout)
      )
    ]);
  }
  
  /**
   * Validate initialization
   */
  async validateInitialization() {
    const criticalComponents = [
      'errorHandling',
      'configuration',
      'departments',
      'commandHandler',
      'router'
    ];
    
    for (const component of criticalComponents) {
      const state = this.initState.components.get(component);
      
      if (!state || (state.status !== 'ready' && state.status !== 'recovered')) {
        throw new Error(`Critical component '${component}' not initialized`);
      }
    }
    
    logger.info('🏁 Initialization validation passed');
  }
  
  /**
   * Get initialization report
   */
  getInitReport() {
    const phases = {};
    for (const [name, state] of this.initState.phases) {
      phases[name] = {
        status: state.status,
        duration: state.duration,
        components: state.components.length,
        errors: state.errors.length
      };
    }
    
    const components = {};
    for (const [name, state] of this.initState.components) {
      components[name] = {
        status: state.status,
        duration: state.duration,
        attempts: state.attempts
      };
    }
    
    return {
      status: this.initState.status,
      duration: this.initState.duration,
      phases,
      components,
      summary: {
        totalPhases: this.initState.phases.size,
        completedPhases: Array.from(this.initState.phases.values())
          .filter(p => p.status === 'completed').length,
        totalComponents: this.initState.components.size,
        initializedComponents: Array.from(this.initState.components.values())
          .filter(c => c.status === 'ready' || c.status === 'recovered').length
      }
    };
  }
}

module.exports = {
  SimplifiedInitManager,
  INIT_PHASES,
  COMPONENT_INITIALIZERS
};