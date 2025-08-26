/**
 * Command Execution Bridge V2
 * Enhanced with specialist coordination and collaboration
 * Sprint 2: Advanced Command Execution
 */

const { logger } = require('../logging/bumba-logger');
const { 
  COMMAND_CATALOG, 
  getCommand, 
  enrichPromptWithContext 
} = require('./command-catalog');

// Import department managers
const { BackendEngineerManager } = require('../departments/backend-engineer-manager');
const { DesignEngineerManager } = require('../departments/design-engineer-manager');
const { ProductStrategistManager } = require('../departments/product-strategist-manager');

// Import coordination system
const { SpecialistCoordinator, CoordinationStrategy } = require('../coordination/specialist-coordinator');

// Import specialist factory
const { getFactory } = require('./specialist-factory-sprint2');

// Import pooling system
const { ProductionSpecialistPool } = require('../pooling-v2/production-specialist-pool');

class CommandExecutionBridgeV2 {
  constructor() {
    // Initialize department managers
    this.departments = new Map();
    this.departments.set('backend', new BackendEngineerManager());
    this.departments.set('frontend', new DesignEngineerManager());
    this.departments.set('product', new ProductStrategistManager());
    
    // Initialize coordinators for each department
    this.coordinators = new Map();
    this.coordinators.set('backend', new SpecialistCoordinator('backend'));
    this.coordinators.set('frontend', new SpecialistCoordinator('frontend'));
    this.coordinators.set('product', new SpecialistCoordinator('product'));
    this.coordinators.set('cross-functional', new SpecialistCoordinator('cross-functional'));
    
    // Initialize specialist factory
    this.specialistFactory = getFactory();
    
    // Initialize pooling system
    this.initializePoolingSystem();
    
    // Track command execution metrics
    this.metrics = {
      totalCommands: 0,
      warmHits: 0,
      coldStarts: 0,
      collaborations: 0,
      averageResponseTime: 0,
      strategyUsage: {
        sequential: 0,
        parallel: 0,
        pipeline: 0,
        consensus: 0,
        hierarchical: 0
      }
    };
    
    logger.info('🟢 Command Execution Bridge V2 initialized with coordination');
  }
  
  /**
   * Initialize the intelligent pooling system
   */
  async initializePoolingSystem() {
    try {
      this.specialistPool = new ProductionSpecialistPool({
        maxSpecialists: 83,
        maxWarmSpecialists: 20, // Increased for Sprint 2
        cooldownTime: 30000,    // Reduced for better performance
        warmThreshold: 0.3,
        priorityWeighting: true,
        departmentBalance: true,
        workflowOptimization: true,
        adaptiveScaling: true,
        enterpriseMonitoring: true,
        verbose: false
      });
      
      logger.info('🏁 Pooling system initialized for Sprint 2');
      
    } catch (error) {
      logger.error('Failed to initialize pooling system:', error);
      this.specialistPool = null;
    }
  }
  
  /**
   * Execute a command with enhanced coordination
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
      logger.info(`   Category: ${commandDef.category}`);
      
      // 2. Enrich the prompt with command context
      const userPrompt = args.join(' ');
      const enrichedPrompt = enrichPromptWithContext(commandName, userPrompt);
      
      // 3. Get specialists from factory/pool
      const specialists = await this.getSpecialistsForCommand(commandDef);
      
      // 4. Determine coordination strategy
      const strategy = this.determineStrategy(commandDef, specialists.length);
      logger.info(`   Strategy: ${strategy}`);
      
      // 5. Get the appropriate coordinator
      const coordinator = this.coordinators.get(commandDef.department) || 
                         this.coordinators.get('cross-functional');
      
      // 6. Execute through coordinator
      const coordinationResult = await coordinator.coordinateTask(
        {
          command: commandName,
          prompt: enrichedPrompt,
          context: commandDef.context,
          userRequest: userPrompt
        },
        specialists,
        strategy
      );
      
      // 7. Track metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, specialists, strategy, coordinationResult.success);
      
      // 8. Release specialists back to pool
      await this.releaseSpecialists(specialists);
      
      logger.info(`🏁 Command ${commandName} completed in ${responseTime}ms`);
      
      return {
        success: true,
        command: commandName,
        department: commandDef.department,
        strategy,
        specialists: commandDef.specialists,
        result: coordinationResult.result,
        outputs: commandDef.outputs,
        metrics: {
          responseTime,
          warmHits: specialists.filter(s => s.wasWarm).length,
          coldStarts: specialists.filter(s => !s.wasWarm).length,
          specialistsUsed: specialists.length
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
   * Get specialists for command execution
   */
  async getSpecialistsForCommand(commandDef) {
    const specialists = [];
    
    for (const specialistName of commandDef.specialists) {
      try {
        let specialist;
        let wasWarm = false;
        
        // Try to get from pool first
        if (this.specialistPool) {
          try {
            const poolResult = await this.specialistPool.executeTask({
              specialistId: specialistName,
              type: 'direct-request',
              department: commandDef.department
            });
            
            if (poolResult.success && poolResult.specialist) {
              specialist = poolResult.specialist;
              wasWarm = poolResult.wasWarm;
              this.metrics.warmHits += wasWarm ? 1 : 0;
              this.metrics.coldStarts += wasWarm ? 0 : 1;
            }
          } catch (poolError) {
            logger.warn(`Pool failed for ${specialistName}: ${poolError.message}`);
          }
        }
        
        // Fallback to factory
        if (!specialist) {
          specialist = await this.specialistFactory.createSpecialist(
            specialistName, 
            commandDef.department,
            { cold: true }
          );
          wasWarm = false;
          this.metrics.coldStarts++;
        }
        
        // Add metadata
        specialist.wasWarm = wasWarm;
        specialist.name = specialist.name || specialistName;
        specialist.id = specialist.id || specialistName;
        
        specialists.push(specialist);
        
        logger.info(`   ${wasWarm ? '🟢' : '🔵'} ${specialistName} ${wasWarm ? '(warm)' : '(cold start)'}`);
        
      } catch (error) {
        logger.warn(`   🟠️ Failed to get specialist ${specialistName}: ${error.message}`);
      }
    }
    
    return specialists;
  }
  
  /**
   * Determine coordination strategy based on command
   */
  determineStrategy(commandDef, specialistCount) {
    // Use metadata from command definition
    const context = commandDef.context || {};
    
    // Pipeline for sequential dependencies
    if (context.pipeline || context.sequential) {
      this.metrics.strategyUsage.pipeline++;
      return CoordinationStrategy.PIPELINE;
    }
    
    // Consensus for analysis/validation commands
    if (commandDef.category === 'analysis' || commandDef.category === 'testing') {
      this.metrics.strategyUsage.consensus++;
      return CoordinationStrategy.CONSENSUS;
    }
    
    // Hierarchical for complex multi-specialist tasks
    if (specialistCount > 3 && commandDef.department === 'cross-functional') {
      this.metrics.strategyUsage.hierarchical++;
      return CoordinationStrategy.HIERARCHICAL;
    }
    
    // Sequential for dependent operations
    if (context.dependencies || context.ordered) {
      this.metrics.strategyUsage.sequential++;
      return CoordinationStrategy.SEQUENTIAL;
    }
    
    // Default to parallel for efficiency
    this.metrics.strategyUsage.parallel++;
    return CoordinationStrategy.PARALLEL;
  }
  
  /**
   * Release specialists back to pool
   */
  async releaseSpecialists(specialists) {
    for (const specialist of specialists) {
      if (specialist.release && typeof specialist.release === 'function') {
        await specialist.release();
      }
    }
  }
  
  /**
   * Update execution metrics
   */
  updateMetrics(responseTime, specialists, strategy, success) {
    const count = this.metrics.totalCommands;
    const oldAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (oldAvg * (count - 1) + responseTime) / count;
    
    // Track collaboration if multiple specialists worked together
    if (specialists.length > 1 && 
        (strategy === CoordinationStrategy.PARALLEL || 
         strategy === CoordinationStrategy.CONSENSUS)) {
      this.metrics.collaborations++;
    }
  }
  
  /**
   * Execute a batch of commands
   */
  async executeBatch(commands) {
    logger.info(`📦 Executing batch of ${commands.length} commands`);
    
    const results = [];
    const startTime = Date.now();
    
    // Group commands by department for efficiency
    const departmentGroups = new Map();
    
    for (const cmd of commands) {
      const commandDef = getCommand(cmd.name);
      if (commandDef) {
        const dept = commandDef.department;
        if (!departmentGroups.has(dept)) {
          departmentGroups.set(dept, []);
        }
        departmentGroups.get(dept).push(cmd);
      }
    }
    
    // Execute each department group
    for (const [dept, deptCommands] of departmentGroups) {
      logger.info(`   Processing ${deptCommands.length} ${dept} commands`);
      
      // Execute commands in parallel within department
      const deptResults = await Promise.all(
        deptCommands.map(cmd => 
          this.executeCommand(cmd.name, cmd.args || [], cmd.context || {})
        )
      );
      
      results.push(...deptResults);
    }
    
    const batchTime = Date.now() - startTime;
    
    return {
      success: true,
      batchSize: commands.length,
      results,
      totalTime: batchTime,
      averageTime: batchTime / commands.length,
      successRate: results.filter(r => r.success).length / results.length
    };
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    const coordinatorMetrics = {};
    for (const [dept, coordinator] of this.coordinators) {
      coordinatorMetrics[dept] = coordinator.getMetrics();
    }
    
    return {
      ...this.metrics,
      warmHitRate: this.metrics.totalCommands > 0 
        ? (this.metrics.warmHits / (this.metrics.warmHits + this.metrics.coldStarts)) 
        : 0,
      collaborationRate: this.metrics.totalCommands > 0
        ? (this.metrics.collaborations / this.metrics.totalCommands)
        : 0,
      coordinators: coordinatorMetrics,
      factory: this.specialistFactory.getMetrics()
    };
  }
  
  /**
   * Get command recommendations based on context
   */
  async getCommandRecommendations(context) {
    const recommendations = [];
    
    // Analyze context to suggest relevant commands
    const keywords = context.toLowerCase().split(' ');
    
    Object.entries(COMMAND_CATALOG).forEach(([cmdName, cmdDef]) => {
      let relevance = 0;
      
      // Check description match
      if (cmdDef.description.toLowerCase().includes(context.toLowerCase())) {
        relevance += 2;
      }
      
      // Check keyword matches
      keywords.forEach(keyword => {
        if (cmdDef.description.toLowerCase().includes(keyword)) {
          relevance += 1;
        }
        if (cmdDef.category.includes(keyword)) {
          relevance += 1;
        }
      });
      
      if (relevance > 0) {
        recommendations.push({
          command: cmdName,
          description: cmdDef.description,
          category: cmdDef.category,
          relevance
        });
      }
    });
    
    // Sort by relevance
    recommendations.sort((a, b) => b.relevance - a.relevance);
    
    return recommendations.slice(0, 5);
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new CommandExecutionBridgeV2();
  }
  return instance;
}

module.exports = {
  CommandExecutionBridgeV2,
  getInstance
};