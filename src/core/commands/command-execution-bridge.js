/**
 * Command Execution Bridge
 * Connects commands to department managers and pooling system
 * 
 * @deprecated Use command-execution-bridge-v2.js instead
 * This is the v1 implementation kept for compatibility
 * 
 * Flow: Command → Department Manager → Pooling System → Specialist
 */

const { logger } = require('../logging/bumba-logger');
const { 
  COMMAND_CATALOG, 
  getCommand, 
  getSpecialistsForCommand,
  enrichPromptWithContext 
} = require('./command-catalog');

// Import department managers
const { BackendEngineerManager } = require('../departments/backend-engineer-manager');
const { DesignEngineerManager } = require('../departments/design-engineer-manager');
const { ProductStrategistManager } = require('../departments/product-strategist-manager');

// Import pooling system
const { BumbaIntegrationBridge } = require('../pooling-v2/bumba-integration-bridge');
const { ProductionSpecialistPool } = require('../pooling-v2/production-specialist-pool');

// Import specialist factory for real specialists
const { getFactory } = require('./specialist-factory-sprint2');

class CommandExecutionBridge {
  constructor() {
    // Initialize department managers
    this.departments = new Map();
    this.departments.set('backend', new BackendEngineerManager());
    this.departments.set('frontend', new DesignEngineerManager());
    this.departments.set('product', new ProductStrategistManager());
    
    // Initialize pooling system
    this.initializePoolingSystem();
    
    // Track command execution metrics
    this.metrics = {
      totalCommands: 0,
      warmHits: 0,
      coldStarts: 0,
      averageResponseTime: 0
    };
    
    logger.info('🟢 Command Execution Bridge initialized');
  }
  
  /**
   * Initialize the intelligent pooling system
   */
  async initializePoolingSystem() {
    try {
      // Create production specialist pool
      this.specialistPool = new ProductionSpecialistPool({
        maxSpecialists: 83,
        maxWarmSpecialists: 17,
        cooldownTime: 45000,
        warmThreshold: 0.3,
        priorityWeighting: true,
        departmentBalance: true,
        workflowOptimization: true,
        adaptiveScaling: true,
        enterpriseMonitoring: true,
        verbose: false
      });
      
      // Create integration bridge for backward compatibility
      this.poolingBridge = new BumbaIntegrationBridge({
        mode: 'full',
        enableBackwardCompatibility: true,
        enableAutomaticFallback: true,
        fallbackThreshold: 0.8,
        verbose: false
      });
      
      // Initialize the bridge with legacy system reference
      await this.poolingBridge.initialize({
        // Legacy system would go here if needed
        executeTask: async (task) => {
          logger.warn('Falling back to legacy execution');
          return { success: false, message: 'Legacy system not available' };
        }
      });
      
      logger.info('🏁 Pooling system initialized with 83 specialists');
      
    } catch (error) {
      logger.error('Failed to initialize pooling system:', error);
      // Continue without pooling - will spawn cold specialists
      this.specialistPool = null;
      this.poolingBridge = null;
    }
  }
  
  /**
   * Execute a command through the proper department and pooling
   */
  async executeCommand(commandName, args = [], context = {}) {
    const startTime = Date.now();
    this.metrics.totalCommands++;
    
    try {
      // 1. Get command definition
      const commandDef = getCommand(commandName);
      if (!commandDef) {
        throw new Error(`Unknown command: ${commandName}`);
      }
      
      logger.info(`🟡 Executing command: ${commandName}`);
      logger.info(`   Department: ${commandDef.department}`);
      logger.info(`   Specialists needed: ${commandDef.specialists.join(', ')}`);
      
      // 2. Enrich the prompt with command context
      const userPrompt = args.join(' ');
      const enrichedPrompt = enrichPromptWithContext(commandName, userPrompt);
      
      // 3. Determine which department manager to use
      const department = this.mapDepartmentName(commandDef.department);
      const departmentManager = this.departments.get(department);
      
      if (!departmentManager) {
        throw new Error(`No department manager for: ${commandDef.department}`);
      }
      
      // 4. Get specialists from pool
      const specialists = await this.getSpecialistsFromPool(commandDef.specialists);
      
      // 5. Execute through department manager
      const result = await this.executeThroughDepartment(
        departmentManager,
        commandDef,
        enrichedPrompt,
        specialists,
        context
      );
      
      // 6. Track metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, specialists);
      
      // 7. Return specialists to pool
      await this.returnSpecialistsToPool(specialists);
      
      logger.info(`🏁 Command completed in ${responseTime}ms`);
      
      return {
        success: true,
        command: commandName,
        department: commandDef.department,
        specialists: commandDef.specialists,
        result,
        metrics: {
          responseTime,
          warmHits: specialists.filter(s => s.wasWarm).length,
          coldStarts: specialists.filter(s => !s.wasWarm).length
        }
      };
      
    } catch (error) {
      logger.error(`🔴 Command execution failed: ${error.message}`);
      return {
        success: false,
        command: commandName,
        error: error.message
      };
    }
  }
  
  /**
   * Map department names from catalog to manager keys
   */
  mapDepartmentName(catalogDepartment) {
    const mapping = {
      'backend': 'backend',
      'frontend': 'frontend',
      'product': 'product',
      'cross-functional': 'backend' // Default cross-functional to backend for now
    };
    return mapping[catalogDepartment] || 'backend';
  }
  
  /**
   * Get specialists from the pooling system
   */
  async getSpecialistsFromPool(specialistNames) {
    const specialists = [];
    
    for (const specialistName of specialistNames) {
      try {
        let specialist;
        let wasWarm = false;
        
        if (this.specialistPool) {
          // Try to get from intelligent pool
          const poolResult = await this.specialistPool.executeTask({
            specialistId: specialistName,
            type: 'direct-request'
          });
          
          if (poolResult.success) {
            specialist = poolResult.specialist;
            wasWarm = poolResult.wasWarm;
            this.metrics.warmHits += wasWarm ? 1 : 0;
            this.metrics.coldStarts += wasWarm ? 0 : 1;
          }
        }
        
        if (!specialist) {
          // Fallback: Get specialist class from department and spawn cold
          specialist = await this.spawnColdSpecialist(specialistName);
          wasWarm = false;
          this.metrics.coldStarts++;
        }
        
        specialists.push({
          name: specialistName,
          instance: specialist,
          wasWarm
        });
        
        logger.info(`   ${wasWarm ? '🟢' : '🔵'} ${specialistName} ${wasWarm ? '(warm)' : '(cold start)'}`);
        
      } catch (error) {
        logger.warn(`   🟠️ Failed to get specialist ${specialistName}: ${error.message}`);
      }
    }
    
    return specialists;
  }
  
  /**
   * Spawn a cold specialist when pool is not available
   */
  async spawnColdSpecialist(specialistName) {
    // This is a fallback - ideally everything goes through the pool
    logger.warn(`Cold spawning specialist: ${specialistName}`);
    
    // Use the specialist factory to get real specialist
    const factory = getFactory();
    const specialist = await factory.createSpecialist(specialistName, 'general', {
      cold: true,
      source: 'command-bridge'
    });
    
    return specialist;
  }
  
  /**
   * Execute command through department manager with specialists
   */
  async executeThroughDepartment(departmentManager, commandDef, enrichedPrompt, specialists, context) {
    // For now, we'll simulate department execution
    // In Sprint 2, we'll enhance department managers to properly coordinate specialists
    
    const results = [];
    
    for (const specialist of specialists) {
      if (specialist.instance && specialist.instance.execute) {
        const result = await specialist.instance.execute(enrichedPrompt);
        results.push(result);
      }
    }
    
    // Aggregate results
    return {
      success: true,
      department: departmentManager.name,
      command: commandDef.description,
      specialists: specialists.map(s => s.name),
      outputs: commandDef.outputs,
      results
    };
  }
  
  /**
   * Return specialists to pool for potential reuse
   */
  async returnSpecialistsToPool(specialists) {
    // Mark specialists as available for reuse
    // The pooling system will manage their lifecycle
    for (const specialist of specialists) {
      if (specialist.instance && specialist.instance.release) {
        await specialist.instance.release();
      }
    }
  }
  
  /**
   * Update execution metrics
   */
  updateMetrics(responseTime, specialists) {
    const count = this.metrics.totalCommands;
    const oldAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (oldAvg * (count - 1) + responseTime) / count;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      warmHitRate: this.metrics.totalCommands > 0 
        ? (this.metrics.warmHits / (this.metrics.warmHits + this.metrics.coldStarts)) 
        : 0
    };
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new CommandExecutionBridge();
  }
  return instance;
}

module.exports = {
  CommandExecutionBridge,
  getInstance
};