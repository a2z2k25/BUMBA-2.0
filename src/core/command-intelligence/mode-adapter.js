/**
 * BUMBA Mode Adapter
 * Adapts command execution based on active mode
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getModeManager } = require('./mode-manager');
const { getInstance: getSelector } = require('./specialist-selector');
const { getInstance: getCoordinator } = require('./department-coordinator');

class ModeAdapter {
  constructor() {
    this.modeManager = getModeManager();
    this.specialistSelector = getSelector();
    this.coordinator = getCoordinator();
  }

  /**
   * Adapt command execution to current mode
   */
  async adaptExecution(command, args, context, executor) {
    // Read current mode
    await this.modeManager.readMode();
    const mode = this.modeManager.currentMode;
    const modeConfig = this.modeManager.getCurrentModeConfig();
    
    logger.info(`🎯 Adapting execution for ${mode} mode`);
    
    // Apply mode-specific adaptations
    const adaptedContext = this.modeManager.applyModeToExecution(
      command, 
      args, 
      context
    );
    
    // Route to appropriate execution path
    switch (mode) {
      case 'lite':
        return await this.executeLiteMode(command, args, adaptedContext, executor);
        
      case 'turbo':
        return await this.executeTurboMode(command, args, adaptedContext, executor);
        
      case 'eco':
        return await this.executeEcoMode(command, args, adaptedContext, executor);
        
      case 'dice':
        return await this.executeDiceMode(command, args, adaptedContext, executor);
        
      case 'executive':
        return await this.executeExecutiveMode(command, args, adaptedContext, executor);
        
      case 'full':
      default:
        return await this.executeFullMode(command, args, adaptedContext, executor);
    }
  }

  /**
   * Execute in Lite Mode - Fast, minimal processing
   */
  async executeLiteMode(command, args, context, executor) {
    logger.info(`⚡ Executing in Lite Mode - Fast execution`);
    
    // Skip specialist selection
    context.skipSpecialists = true;
    context.skipAnalysis = true;
    
    // Use template-based output
    context.useTemplates = true;
    
    // Set short timeout
    const timeout = 10000;
    
    try {
      const result = await this.executeWithTimeout(
        executor(command, args, context),
        timeout
      );
      
      return {
        ...result,
        mode: 'lite',
        executionTime: 'fast'
      };
    } catch (error) {
      logger.error(`Lite mode execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute in Turbo Mode - Maximum parallelization
   */
  async executeTurboMode(command, args, context, executor) {
    logger.info(`🚀 Executing in Turbo Mode - Maximum parallel processing`);
    
    // Force parallel execution where possible
    context.forceParallel = true;
    context.maxConcurrency = 10;
    
    // Enable aggressive caching
    context.enableCache = true;
    
    // If collaboration needed, use parallel coordinator
    if (context.requireCollaboration) {
      const departments = context.departments || ['product', 'design', 'backend'];
      
      // Create parallel tasks
      const parallelTasks = departments.map(dept => ({
        department: dept,
        command,
        args,
        dependsOn: [] // No dependencies in turbo mode
      }));
      
      // Execute all departments in parallel
      const ParallelExecutor = require('./parallel-executor').getInstance();
      const results = await ParallelExecutor.executeParallel(
        parallelTasks,
        command,
        args,
        context
      );
      
      return {
        ...results,
        mode: 'turbo',
        executionTime: 'parallel'
      };
    }
    
    // Single department turbo execution
    return await executor(command, args, context);
  }

  /**
   * Execute in Eco Mode - Resource-conscious
   */
  async executeEcoMode(command, args, context, executor) {
    logger.info(`🌱 Executing in Eco Mode - Resource optimized`);
    
    // Limit resource usage
    context.limitSpecialists = 2; // Max 2 specialists
    context.skipNonEssential = true;
    context.compactOutput = true;
    
    // Use caching aggressively
    context.enableCache = true;
    context.reuseAnalysis = true;
    
    // Check if we can reuse previous results
    const cachedResult = await this.checkCache(command, args);
    if (cachedResult) {
      logger.info(`♻️ Reusing cached result`);
      return {
        ...cachedResult,
        mode: 'eco',
        cached: true
      };
    }
    
    // Execute with resource limits
    const result = await executor(command, args, context);
    
    // Cache result for reuse
    await this.cacheResult(command, args, result);
    
    return {
      ...result,
      mode: 'eco',
      executionTime: 'optimized'
    };
  }

  /**
   * Execute in DICE Mode - Distributed execution
   */
  async executeDiceMode(command, args, context, executor) {
    logger.info(`🎲 Executing in DICE Mode - Distributed intelligence`);
    
    // Enable distributed features
    context.distributed = true;
    context.useRemoteAgents = true;
    context.enableSharding = true;
    
    // Split work across multiple agents
    const shards = this.createShards(command, args);
    
    if (shards.length > 1) {
      // Execute shards in parallel
      const shardResults = await Promise.all(
        shards.map(shard => 
          executor(shard.command, shard.args, {
            ...context,
            shardId: shard.id,
            totalShards: shards.length
          })
        )
      );
      
      // Merge shard results
      return {
        success: shardResults.every(r => r.success),
        mode: 'dice',
        shards: shardResults,
        merged: this.mergeShardResults(shardResults)
      };
    }
    
    // Single shard execution
    return await executor(command, args, context);
  }

  /**
   * Execute in Executive Mode - Strategic planning
   */
  async executeExecutiveMode(command, args, context, executor) {
    logger.info(`👔 Executing in Executive Mode - Strategic execution`);
    
    // Enable strategic features
    context.strategic = true;
    context.includeRoadmap = true;
    context.includeMetrics = true;
    context.includeRiskAssessment = true;
    
    // Always use full specialist analysis
    context.requireFullAnalysis = true;
    
    // Get comprehensive analysis
    const result = await executor(command, args, context);
    
    // Add executive summary
    const executiveSummary = await this.generateExecutiveSummary(result);
    
    return {
      ...result,
      mode: 'executive',
      executiveSummary,
      strategicInsights: this.extractStrategicInsights(result)
    };
  }

  /**
   * Execute in Full Mode - All features enabled
   */
  async executeFullMode(command, args, context, executor) {
    logger.info(`🔷 Executing in Full Mode - All features enabled`);
    
    // All features enabled by default
    context.fullMode = true;
    
    return await executor(command, args, context);
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Execution timeout (${timeout}ms)`)), timeout)
      )
    ]);
  }

  /**
   * Create shards for distributed execution
   */
  createShards(command, args) {
    // Simple sharding strategy - split args
    if (args.length <= 1) {
      return [{ id: 0, command, args }];
    }
    
    const shardSize = Math.ceil(args.length / 3);
    const shards = [];
    
    for (let i = 0; i < args.length; i += shardSize) {
      shards.push({
        id: shards.length,
        command,
        args: args.slice(i, i + shardSize)
      });
    }
    
    return shards;
  }

  /**
   * Merge results from shards
   */
  mergeShardResults(results) {
    const merged = {
      success: results.every(r => r.success),
      files: [],
      insights: [],
      recommendations: []
    };
    
    for (const result of results) {
      if (result.file) merged.files.push(result.file);
      if (result.insights) merged.insights.push(...result.insights);
      if (result.recommendations) merged.recommendations.push(...result.recommendations);
    }
    
    return merged;
  }

  /**
   * Check cache for result
   */
  async checkCache(command, args) {
    // Simple in-memory cache (could be enhanced with persistent cache)
    const cacheKey = `${command}_${args.join('_')}`;
    return this.cache?.get(cacheKey);
  }

  /**
   * Cache result
   */
  async cacheResult(command, args, result) {
    if (!this.cache) {
      this.cache = new Map();
    }
    
    const cacheKey = `${command}_${args.join('_')}`;
    this.cache.set(cacheKey, {
      ...result,
      cachedAt: new Date().toISOString()
    });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(result) {
    return {
      overview: `Command executed successfully with ${result.department || 'primary'} department`,
      keyMetrics: {
        success: result.success,
        specialists: result.specialists?.length || 0,
        priority: result.analysis?.priority || 'normal',
        complexity: result.analysis?.complexity || 'medium'
      },
      recommendations: result.recommendations?.slice(0, 3) || [],
      nextSteps: this.determineNextSteps(result)
    };
  }

  /**
   * Extract strategic insights
   */
  extractStrategicInsights(result) {
    const insights = [];
    
    if (result.analysis?.priority === 'critical') {
      insights.push('Critical priority requires immediate executive attention');
    }
    
    if (result.analysis?.complexity === 'high') {
      insights.push('High complexity suggests phased implementation approach');
    }
    
    if (result.specialists?.length > 3) {
      insights.push('Multiple specialist involvement indicates cross-functional impact');
    }
    
    return insights;
  }

  /**
   * Determine next steps
   */
  determineNextSteps(result) {
    const steps = [];
    
    if (result.success) {
      steps.push('Review generated deliverables');
      steps.push('Validate with stakeholders');
      
      if (result.file) {
        steps.push(`Review output file: ${result.fileName || 'generated file'}`);
      }
    } else {
      steps.push('Address identified issues');
      steps.push('Re-run with corrected parameters');
    }
    
    return steps;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ModeAdapter,
  getInstance: () => {
    if (!instance) {
      instance = new ModeAdapter();
    }
    return instance;
  }
};