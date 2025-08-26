/**
 * BUMBA Lite Mode - Integration Layer
 * 
 * Combines all Lite Mode components into a cohesive system
 * Sprint 3: Integrating coordination with specialists
 */

const { LiteSpecialistFactory } = require('./lite-specialists');
const { LiteModeWithCoordination } = require('./lite-coordination');
const { ResourceOptimizer } = require('./resource-optimizer');
const { LiteInteractiveMenu, LiteCommandInterface } = require('./lite-interactive-menu');

/**
 * Enhanced Lite Mode with all features
 */
class BumbaLiteEnhanced {
  constructor(options = {}) {
    // Configuration
    this.config = {
      maxMemory: options.maxMemory || 40 * 1024 * 1024, // 40MB default
      maxStartupTime: options.maxStartupTime || 150, // 150ms
      enableCoordination: options.enableCoordination !== false,
      enableCache: options.enableCache !== false,
      enableOptimization: options.enableOptimization !== false,
      visual: options.visual || false
    };

    // Initialize components
    this.specialistFactory = new LiteSpecialistFactory();
    this.specialists = this.specialistFactory.getAll();
    
    // Setup coordination if enabled
    if (this.config.enableCoordination) {
      this.coordination = new LiteModeWithCoordination(this.specialists);
    }
    
    // Setup resource optimizer if enabled
    if (this.config.enableOptimization) {
      this.optimizer = new ResourceOptimizer({
        limits: {
          memory: this.config.maxMemory,
          concurrent: 3
        },
        enableMemoryPool: true,
        enableSmartCache: this.config.enableCache,
        enableBatching: true,
        enableLazyLoading: true
      });
    }
    
    // Interactive features
    this.interactiveMenu = null;
    this.commandInterface = new LiteCommandInterface(this);
    
    // Performance tracking
    this.metrics = {
      startupTime: 0,
      memoryUsage: 0,
      tasksExecuted: 0,
      avgExecutionTime: 0
    };
    
    // Track startup time
    this.startupTime = Date.now();
  }

  /**
   * Initialize and validate startup constraints
   */
  async initialize() {
    const start = Date.now();
    
    // Check memory footprint
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.config.maxMemory) {
      console.warn(`🟠️ Memory usage (${memoryUsage}) exceeds target (${this.config.maxMemory})`);
    }
    
    // Check startup time
    const startupTime = Date.now() - this.startupTime;
    if (startupTime > this.config.maxStartupTime) {
      console.warn(`🟠️ Startup time (${startupTime}ms) exceeds target (${this.config.maxStartupTime}ms)`);
    }
    
    this.metrics.startupTime = startupTime;
    this.metrics.memoryUsage = memoryUsage;
    
    if (this.config.visual) {
      this.displayStartupInfo();
    }
    
    return {
      ready: true,
      startupTime,
      memoryUsage,
      specialists: this.specialists.length,
      coordination: this.config.enableCoordination
    };
  }

  /**
   * Main execution interface
   */
  async execute(task) {
    const start = Date.now();
    this.metrics.tasksExecuted++;
    
    try {
      let result;
      
      // Check cache first if optimizer enabled
      if (this.optimizer) {
        const cacheKey = this.generateCacheKey(task);
        const cached = this.optimizer.cacheGet(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Execute with optimization if enabled
      const executeTask = async () => {
        // Use coordination for complex tasks
        if (this.config.enableCoordination && this.isComplexTask(task)) {
          return await this.coordination.execute(task);
        } else {
          // Direct specialist execution for simple tasks
          return await this.executeSimple(task);
        }
      };
      
      if (this.optimizer) {
        result = await this.optimizer.executeOptimized(executeTask);
        // Cache result if valid
        if (result) {
          const cacheKey = this.generateCacheKey(task);
          const resultSize = JSON.stringify(result).length;
          this.optimizer.cacheSet(cacheKey, result, resultSize);
        }
      } else {
        result = await executeTask();
      }
      
      // Update metrics
      const duration = Date.now() - start;
      this.metrics.avgExecutionTime = 
        (this.metrics.avgExecutionTime * (this.metrics.tasksExecuted - 1) + duration) / 
        this.metrics.tasksExecuted;
      
      return result;
      
    } catch (error) {
      console.error('Lite Mode execution error:', error);
      throw error;
    }
  }

  /**
   * Generate cache key for task
   */
  generateCacheKey(task) {
    const key = `${task.type || 'general'}_${task.prompt?.substring(0, 50)}`;
    return key;
  }

  /**
   * Simple task execution without coordination
   */
  async executeSimple(task) {
    // Determine specialist type
    const specialistType = this.selectSpecialistType(task);
    const specialist = this.specialistFactory.get(specialistType);
    
    if (!specialist) {
      throw new Error(`No specialist available for type: ${specialistType}`);
    }
    
    return await specialist.execute(task);
  }

  /**
   * Determine if task requires coordination
   */
  isComplexTask(task) {
    const complexIndicators = [
      'fullstack', 'app', 'platform', 'system',
      'feature', 'complete', 'integrate', 'deploy'
    ];
    
    const taskStr = JSON.stringify(task).toLowerCase();
    return complexIndicators.some(indicator => taskStr.includes(indicator));
  }

  /**
   * Select appropriate specialist type
   */
  selectSpecialistType(task) {
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('design') || taskStr.includes('ui') || taskStr.includes('layout')) {
      return 'designer';
    }
    if (taskStr.includes('api') || taskStr.includes('backend') || taskStr.includes('database')) {
      return 'engineer';
    }
    if (taskStr.includes('react') || taskStr.includes('vue') || taskStr.includes('frontend')) {
      return 'frontend';
    }
    if (taskStr.includes('test') || taskStr.includes('debug') || taskStr.includes('validate')) {
      return 'tester';
    }
    if (taskStr.includes('plan') || taskStr.includes('strategy') || taskStr.includes('requirements')) {
      return 'strategist';
    }
    
    // Default to engineer
    return 'engineer';
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    // Calculate approximate memory usage
    let total = 0;
    
    // Specialist memory
    total += this.specialistFactory.getMemoryUsage() * 1024; // Convert KB to bytes
    
    // Coordination overhead (if enabled)
    if (this.config.enableCoordination) {
      total += 2 * 1024 * 1024; // ~2MB for coordination
    }
    
    // Base framework
    total += 25 * 1024 * 1024; // ~25MB base
    
    return total;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const base = {
      ...this.metrics,
      specialists: this.specialistFactory.getMetrics()
    };
    
    if (this.config.enableCoordination) {
      base.coordination = this.coordination.getMetrics();
    }
    
    if (this.optimizer) {
      base.optimization = this.optimizer.getStats();
    }
    
    return base;
  }

  /**
   * Display startup information
   */
  displayStartupInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🟢 BUMBA LITE MODE - Enhanced Edition');
    console.log('='.repeat(60));
    console.log(`📊 Startup Time: ${this.metrics.startupTime}ms`);
    console.log(`💾 Memory Usage: ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB`);
    console.log(`👥 Specialists: ${this.specialists.length}`);
    console.log(`🔄 Coordination: ${this.config.enableCoordination ? 'Enabled' : 'Disabled'}`);
    console.log(`🟢 Optimization: ${this.config.enableOptimization ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Display performance dashboard
   */
  dashboard() {
    const metrics = this.getMetrics();
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 LITE MODE PERFORMANCE DASHBOARD');
    console.log('='.repeat(60));
    
    console.log('\n🟡 Execution Metrics:');
    console.log(`   Tasks Executed: ${metrics.tasksExecuted}`);
    console.log(`   Avg Execution Time: ${Math.round(metrics.avgExecutionTime)}ms`);
    console.log(`   Memory Usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
    
    console.log('\n👥 Specialist Metrics:');
    Object.entries(metrics.specialists).forEach(([type, data]) => {
      console.log(`   ${type}: ${data.calls} calls, ${Math.round(data.avgTime)}ms avg`);
    });
    
    if (metrics.coordination) {
      console.log('\n🔄 Coordination Metrics:');
      console.log(`   Coordinated Tasks: ${metrics.coordination.coordinator.coordinated}`);
      console.log(`   Avg Coordination Time: ${Math.round(metrics.coordination.coordinator.avgTime)}ms`);
      console.log(`   Total Specialists: ${metrics.coordination.totalSpecialists}`);
    }
    
    if (metrics.optimization) {
      console.log('\n🟢 Optimization Metrics:');
      if (metrics.optimization.cache) {
        console.log(`   Cache Hit Rate: ${(metrics.optimization.cache.hitRate * 100).toFixed(1)}%`);
      }
      if (metrics.optimization.memoryPool) {
        console.log(`   Memory Reuse Rate: ${(metrics.optimization.memoryPool.reuseRate * 100).toFixed(1)}%`);
      }
      console.log(`   Tasks Optimized: ${metrics.optimization.optimizations.tasksOptimized}`);
      console.log(`   Memory Health: ${metrics.optimization.monitor.healthy ? '🏁' : '🟠️'}`);
    }
    
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Mode validation
   */
  async validate() {
    const results = {
      memoryConstraint: this.metrics.memoryUsage <= this.config.maxMemory,
      startupConstraint: this.metrics.startupTime <= this.config.maxStartupTime,
      specialistsLoaded: this.specialists.length === 5,
      coordinationReady: !this.config.enableCoordination || !!this.coordination
    };
    
    const allPassed = Object.values(results).every(v => v === true);
    
    if (this.config.visual) {
      console.log('\n' + '='.repeat(60));
      console.log('🏁 LITE MODE VALIDATION');
      console.log('='.repeat(60));
      
      Object.entries(results).forEach(([check, passed]) => {
        console.log(`${passed ? '🏁' : '🔴'} ${check}: ${passed ? 'PASSED' : 'FAILED'}`);
      });
      
      console.log('='.repeat(60));
      console.log(`Overall: ${allPassed ? '🏁 ALL CHECKS PASSED' : '🔴 SOME CHECKS FAILED'}`);
      console.log('='.repeat(60) + '\n');
    }
    
    return {
      passed: allPassed,
      results
    };
  }

  /**
   * Start interactive menu
   */
  async startInteractive() {
    if (!this.interactiveMenu) {
      this.interactiveMenu = new LiteInteractiveMenu();
    }
    await this.interactiveMenu.start(this);
  }

  /**
   * Execute command through command interface
   */
  async executeCommand(command, ...args) {
    return await this.commandInterface.execute(command, ...args);
  }

  /**
   * Check if Lite Mode has feature
   */
  hasFeature(feature) {
    const features = {
      'specialists': true,
      'coordination': this.config.enableCoordination,
      'optimization': this.config.enableOptimization,
      'cache': this.config.enableCache,
      'interactive': true,
      'commands': true,
      'visual': this.config.visual
    };
    return features[feature] || false;
  }

  /**
   * Get feature coverage percentage
   */
  getFeatureCoverage() {
    const fullModeFeatures = 21; // From analysis
    const liteModeFeatures = 8; // Current + interactive menu
    return Math.round((liteModeFeatures / fullModeFeatures) * 100);
  }
}

/**
 * Factory function for easy instantiation
 */
function createLiteMode(options = {}) {
  return new BumbaLiteEnhanced(options);
}

/**
 * Demo function
 */
async function demo(interactive = false) {
  console.log('🟡 Lite Mode Enhanced Demo\n');
  
  // Create instance
  const lite = createLiteMode({ visual: true });
  
  // Initialize
  await lite.initialize();
  
  // Show feature coverage
  console.log(`📊 Feature Coverage: ${lite.getFeatureCoverage()}% of Full Mode\n`);
  
  if (interactive) {
    // Start interactive menu
    console.log('Starting interactive menu...\n');
    await lite.startInteractive();
  } else {
    // Demo various features
    console.log('📝 Testing command interface...');
    await lite.executeCommand('lite:develop', 'Create a login form');
    
    // Simple task
    console.log('\n📝 Executing simple task...');
    const simpleResult = await lite.execute({
      prompt: 'Create a button component',
      type: 'component'
    });
    console.log('Result:', simpleResult.success ? '🏁 Success' : '🔴 Failed');
    
    // Complex task (triggers coordination)
    console.log('\n📝 Executing complex task...');
    const complexResult = await lite.execute({
      prompt: 'Build a complete user authentication feature',
      type: 'feature'
    });
    console.log('Result:', complexResult.success ? '🏁 Success' : '🔴 Failed');
    console.log('Departments involved:', complexResult.departments || 1);
    
    // Test features
    console.log('\n📋 Feature Check:');
    const features = ['specialists', 'coordination', 'optimization', 'cache', 'interactive'];
    features.forEach(feature => {
      console.log(`   ${feature}: ${lite.hasFeature(feature) ? '🏁' : '🔴'}`);
    });
    
    // Show dashboard
    lite.dashboard();
    
    // Validate
    await lite.validate();
  }
}

// Export
module.exports = {
  BumbaLiteEnhanced,
  createLiteMode,
  demo
};

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}