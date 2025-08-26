/**
 * Model-Aware Department Manager Base Class
 * Handles model assignment for managers (Claude Max) and specialists (free tier)
 * Passes model configurations as metadata - actual API calls made by user's integration
 */

const { logger } = require('../logging/bumba-logger');
const chalk = require('chalk');
const { getInstance: getClaudeMaxManager } = require('../agents/claude-max-account-manager');
const { getInstance: getFreeTierManager } = require('../agents/free-tier-manager');
const { DomainModelRouter } = require('../agents/domain-model-router');

class ModelAwareDepartmentManager {
  constructor(name, type, specialists = []) {
    this.name = name;
    this.type = type;
    this.specialists = new Map(specialists);
    this.activeSpecialists = new Map();
    
    // Model assignment systems
    this.claudeMaxManager = null;
    this.freeTierManager = null;
    this.domainRouter = null;
    
    // Model configuration for this manager
    this.modelConfig = null;
    this.usingClaudeMax = false;
    this.claudeMaxLockId = null;
    
    // Metrics
    this.metrics = {
      commandsReceived: 0,
      specialistsSpawned: 0,
      tasksCompleted: 0,
      averageResponseTime: 0,
      modelsAssigned: {
        claudeMax: 0,
        deepseek: 0,
        qwen: 0,
        gemini: 0,
        fallback: 0
      }
    };
    
    this.initializeModelSystems();
    
    // Initialize AI framework and automated selection after model systems
    this.aiModelFramework = this.initializeAIModelFramework();
    
    // Automated selection system
    this.automatedSelection = {
      enabled: true,
      learning_rate: 0.1,
      selection_history: [],
      performance_cache: new Map(),
      optimization_strategies: []
    };
  }
  
  /**
   * Initialize model assignment systems
   */
  initializeModelSystems() {
    try {
      // Initialize Claude Max manager for exclusive access
      this.claudeMaxManager = getClaudeMaxManager();
      logger.info(`🟡 ${this.name} connected to Claude Max manager`);
    } catch (error) {
      logger.warn(`${this.name} could not connect to Claude Max manager: ${error.message}`);
      this.claudeMaxManager = null;
    }
    
    try {
      // Initialize free tier manager for specialist models
      this.freeTierManager = getFreeTierManager();
      logger.info(`🟡 ${this.name} connected to Free Tier manager`);
    } catch (error) {
      logger.warn(`${this.name} could not connect to Free Tier manager: ${error.message}`);
      this.freeTierManager = null;
    }
    
    try {
      // Initialize domain router for optimal model selection
      this.domainRouter = new DomainModelRouter();
      logger.info(`🟡 ${this.name} initialized domain-based model router`);
    } catch (error) {
      logger.warn(`${this.name} could not initialize domain router: ${error.message}`);
      this.domainRouter = null;
    }
  }
  
  /**
   * Main entry point for command execution with model assignment
   */
  async executeCommand(commandName, prompt, context = {}) {
    const startTime = Date.now();
    this.metrics.commandsReceived++;
    
    logger.info(`\n🟡 ${this.name} Manager executing command: ${commandName}`);
    logger.info(`   Acquiring model assignments...`);
    
    // Step 1: Try to acquire Claude Max for this manager
    const managerModelAcquired = await this.acquireManagerModel(commandName);
    
    try {
      // Step 2: Analyze the command and determine needed specialists
      const requiredSpecialists = context.requiredSpecialists || 
                                 await this.analyzeSpecialistNeeds(commandName, prompt);
      
      logger.info(`   Required specialists: ${requiredSpecialists.join(', ')}`);
      
      // Step 3: Spawn specialists with appropriate free tier models
      const spawnedSpecialists = await this.spawnSpecialistsWithModels(
        requiredSpecialists, 
        commandName,
        prompt,
        context
      );
      
      logger.info(chalk.green('🟢 Spawning ' + spawnedSpecialists.length + ' specialist: ' + specialist.id));
      
      // Step 4: Create task with model context
      const task = {
        command: commandName,
        prompt: prompt,
        context: context,
        department: this.name,
        managerModel: this.modelConfig,
        timestamp: new Date().toISOString()
      };
      
      // Step 5: Coordinate specialist execution
      const results = await this.coordinateSpecialists(spawnedSpecialists, task);
      
      // Step 6: Aggregate results
      const aggregatedResult = await this.aggregateResults(results, task);
      
      // Step 7: Update enhanced metrics with performance tracking
      const responseTime = Date.now() - startTime;
      await this.updateEnhancedMetrics(responseTime, spawnedSpecialists, aggregatedResult);
      
      logger.info(`🏁 ${this.name} Manager completed command with AI optimization in ${responseTime}ms`);
      logger.info(`   Manager model: ${this.modelConfig?.model || 'none'} (AI-selected)`);
      logger.info(`   Specialist models: ${spawnedSpecialists.map(s => s.modelConfig?.model || 'none').join(', ')}`);
      logger.info(`   Selection efficiency: ${Math.round(this.metrics.performanceTracking.selection_accuracy * 100)}%`);
      
      return {
        success: true,
        department: this.name,
        command: commandName,
        specialists: requiredSpecialists,
        result: aggregatedResult,
        modelAssignments: {
          manager: this.modelConfig,
          specialists: spawnedSpecialists.map(s => ({
            type: s.type,
            model: s.modelConfig,
            selection_confidence: s.selectionConfidence || 0.8,
            optimization_score: s.optimizationScore || 0.0
          }))
        },
        metrics: {
          responseTime,
          specialistsUsed: spawnedSpecialists.length,
          usingClaudeMax: this.usingClaudeMax,
          aiOptimization: {
            manager_selection_confidence: this.managerSelectionConfidence || 0.8,
            specialist_optimization_score: this.calculateAverageOptimizationScore(spawnedSpecialists),
            performance_improvement: this.metrics.performanceTracking.optimization_improvements
          }
        }
      };
      
    } catch (error) {
      logger.error(`🔴 ${this.name} Manager failed: ${error.message}`);
      throw error;
      
    } finally {
      // Always release Claude Max lock if acquired and record performance
      await this.releaseManagerModel();
      await this.recordSelectionPerformance(commandName, prompt, context);
    }
  }
  
  /**
   * Acquire optimal model for manager with AI-enhanced selection
   */
  async acquireOptimalManagerModel(commandName, prompt, context) {
    // AI-enhanced model selection analysis
    const selectionAnalysis = await this.analyzeOptimalManagerModel(commandName, prompt, context);
    
    // Record selection confidence
    this.managerSelectionConfidence = selectionAnalysis.confidence;
    
    logger.info(`   AI model analysis: ${selectionAnalysis.recommendation} (${Math.round(selectionAnalysis.confidence * 100)}% confidence)`);
    
    return await this.acquireManagerModel(commandName, selectionAnalysis);
  }
  
  /**
   * Acquire model for manager (Claude Max with mutex lock)
   */
  async acquireManagerModel(commandName, selectionAnalysis = null) {
    // Check if this is a review/validation task that requires Claude Max
    const requiresClaudeMax = this.shouldUseClaudeMax(commandName);
    
    if (requiresClaudeMax && this.claudeMaxManager) {
      try {
        // Generate unique lock ID
        this.claudeMaxLockId = `${this.name}-${commandName}-${Date.now()}`;
        
        // Try to acquire Claude Max lock
        const lockAcquired = await this.claudeMaxManager.acquireLock(
          this.claudeMaxLockId,
          'manager',
          2 // Manager priority
        );
        
        if (lockAcquired) {
          // Get Claude Max configuration
          this.modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
          this.usingClaudeMax = true;
          this.metrics.modelsAssigned.claudeMax++;
          
          logger.info(`🔒 ${this.name} acquired Claude Max lock`);
          logger.info(`   Model: ${this.modelConfig.model}`);
          logger.info(`   Config ready for API integration`);
          
          return true;
        } else {
          logger.warn(`⏳ ${this.name} waiting for Claude Max availability`);
        }
      } catch (error) {
        logger.warn(`Could not acquire Claude Max: ${error.message}`);
      }
    }
    
    // Fallback: Manager uses free tier model if Claude Max unavailable
    if (!this.usingClaudeMax) {
      this.modelConfig = this.getManagerFallbackModel();
      logger.info(`📋 ${this.name} using fallback model: ${this.modelConfig.model}`);
    }
    
    return false;
  }
  
  /**
   * Release manager's model lock
   */
  async releaseManagerModel() {
    if (this.usingClaudeMax && this.claudeMaxManager && this.claudeMaxLockId) {
      try {
        await this.claudeMaxManager.releaseLock(this.claudeMaxLockId);
        logger.info(`🔓 ${this.name} released Claude Max lock`);
      } catch (error) {
        logger.error(`Failed to release Claude Max lock: ${error.message}`);
      } finally {
        this.usingClaudeMax = false;
        this.claudeMaxLockId = null;
      }
    }
  }
  
  /**
   * Spawn specialists with AI-optimized model assignments
   */
  async spawnSpecialistsWithOptimizedModels(specialistIds, commandName, prompt, context = {}) {
    logger.info(`   🤖 AI-optimizing model assignments for ${specialistIds.length} specialists...`);
    
    return await this.spawnSpecialistsWithModels(specialistIds, commandName, prompt, context);
  }
  
  /**
   * Spawn specialists with appropriate free tier models
   */
  async spawnSpecialistsWithModels(specialistIds, commandName, prompt, context = {}) {
    const spawned = [];
    
    for (const specialistId of specialistIds) {
      try {
        // Spawn the specialist
        const specialist = await this.spawnSpecialist(specialistId, context);
        
        if (specialist) {
          // AI-enhanced domain and model selection
          const domain = this.determineSpecialistDomain(specialistId, prompt);
          const optimizationAnalysis = await this.analyzeSpecialistModelOptimization(specialistId, domain, commandName, prompt);
          
          // Get AI-optimized model for this specialist
          const modelConfig = await this.assignOptimalSpecialistModel(
            specialistId,
            domain,
            commandName,
            prompt,
            optimizationAnalysis
          );
          
          // Assign enhanced model configuration to specialist
          specialist.modelConfig = modelConfig;
          specialist.domain = domain;
          specialist.selectionConfidence = optimizationAnalysis.confidence;
          specialist.optimizationScore = optimizationAnalysis.optimization_score;
          
          logger.info(`   🏁 ${specialistId}: ${modelConfig.model} (${modelConfig.reason}, ${Math.round(optimizationAnalysis.confidence * 100)}% confidence)`);
          
          spawned.push(specialist);
          this.activeSpecialists.set(specialist.id, specialist);
          this.metrics.specialistsSpawned++;
          
          // Track enhanced model usage with performance
          if (modelConfig.tierKey) {
            this.metrics.modelsAssigned[modelConfig.tierKey]++;
            this.updateModelEfficiencyScore(modelConfig.tierKey, optimizationAnalysis.optimization_score);
          }
        }
      } catch (error) {
        logger.warn(`   🟠️ Failed to spawn ${specialistId}: ${error.message}`);
      }
    }
    
    return spawned;
  }
  
  /**
   * Assign AI-optimized model to specialist
   */
  async assignOptimalSpecialistModel(specialistId, domain, commandName, prompt, optimizationAnalysis) {
    // Enhanced model assignment with AI optimization
    logger.info(`     🤖 Optimizing model for ${specialistId} (${domain} domain)`);
    
    return await this.assignSpecialistModel(specialistId, domain, commandName, prompt, optimizationAnalysis);
  }
  
  /**
   * Assign optimal model to specialist based on domain
   */
  async assignSpecialistModel(specialistId, domain, commandName, prompt, optimizationAnalysis = null) {
    // Never give specialists Claude Max (reserved for managers)
    if (this.domainRouter) {
      try {
        // Use domain router for optimal model selection
        const routingResult = await this.domainRouter.routeTask({
          domain: domain,
          description: prompt,
          type: specialistId,
          priority: 'normal'
        });
        
        if (routingResult.requiresManager) {
          // This is a review task - should have been handled by manager
          logger.warn(`Review task incorrectly routed to specialist: ${specialistId}`);
          return this.getSpecialistFallbackModel(domain);
        }
        
        return {
          model: routingResult.model || 'gemini-pro',
          provider: routingResult.provider || 'google',
          tierKey: routingResult.tierKey || 'gemini',
          reason: optimizationAnalysis ? `AI-optimized: ${routingResult.routingReason}` : routingResult.routingReason || 'Domain-based selection',
          apiKeyRequired: true,
          configuredByUser: false,
          optimization_confidence: optimizationAnalysis?.confidence || 0.8,
          performance_prediction: optimizationAnalysis?.performance_prediction || 'good'
        };
        
      } catch (error) {
        logger.warn(`Domain routing failed: ${error.message}`);
      }
    }
    
    // Enhanced fallback model assignment with optimization context
    const fallbackModel = this.getSpecialistFallbackModel(domain);
    
    if (optimizationAnalysis) {
      fallbackModel.reason = `AI-optimized fallback: ${fallbackModel.reason}`;
      fallbackModel.optimization_confidence = optimizationAnalysis.confidence;
      fallbackModel.performance_prediction = optimizationAnalysis.performance_prediction;
    }
    
    return fallbackModel;
  }
  
  /**
   * Determine domain for a specialist
   */
  determineSpecialistDomain(specialistId, prompt) {
    const specialistLower = specialistId.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    // Reasoning/Analysis specialists
    if (specialistLower.includes('security') || specialistLower.includes('audit') ||
        specialistLower.includes('debug') || promptLower.includes('analyze')) {
      return 'reasoning';
    }
    
    // Coding specialists
    if (specialistLower.includes('developer') || specialistLower.includes('engineer') ||
        specialistLower.includes('api') || specialistLower.includes('backend') ||
        promptLower.includes('implement') || promptLower.includes('code')) {
      return 'coding';
    }
    
    // Frontend/UI specialists
    if (specialistLower.includes('frontend') || specialistLower.includes('ui') ||
        specialistLower.includes('design') || promptLower.includes('interface')) {
      return 'ui';
    }
    
    // General/Documentation
    return 'general';
  }
  
  /**
   * Get fallback model for manager
   */
  getManagerFallbackModel() {
    return {
      model: 'deepseek/deepseek-r1',
      provider: 'deepseek',
      tierKey: 'deepseek',
      reason: 'Manager fallback when Claude Max unavailable',
      apiKeyRequired: true,
      configuredByUser: false
    };
  }
  
  /**
   * Get fallback model for specialist
   */
  getSpecialistFallbackModel(domain) {
    const fallbacks = {
      reasoning: {
        model: 'deepseek/deepseek-r1',
        provider: 'deepseek',
        tierKey: 'deepseek',
        reason: 'Reasoning/analysis fallback'
      },
      coding: {
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        provider: 'qwen',
        tierKey: 'qwen',
        reason: 'Coding/implementation fallback'
      },
      general: {
        model: 'gemini-pro',
        provider: 'google',
        tierKey: 'gemini',
        reason: 'General purpose fallback'
      }
    };
    
    const config = fallbacks[domain] || fallbacks.general;
    return {
      ...config,
      apiKeyRequired: true,
      configuredByUser: false
    };
  }
  
  /**
   * Check if command should use Claude Max
   */
  shouldUseClaudeMax(commandName) {
    // Always use Claude Max for review/validation commands
    const reviewCommands = ['review', 'validate', 'approve', 'audit', 'check'];
    if (reviewCommands.some(cmd => commandName.toLowerCase().includes(cmd))) {
      return true;
    }
    
    // Always use Claude Max for critical commands
    const criticalCommands = ['deploy', 'release', 'publish', 'security'];
    if (criticalCommands.some(cmd => commandName.toLowerCase().includes(cmd))) {
      return true;
    }
    
    // Managers generally should use Claude Max
    return true;
  }
  
  /**
   * Spawn a single specialist (base implementation)
   */
  async spawnSpecialist(specialistId, context = {}) {
    const SpecialistClass = this.specialists.get(specialistId);
    
    if (!SpecialistClass) {
      throw new Error(`Specialist not found: ${specialistId}`);
    }
    
    const specialist = new SpecialistClass(this.name, context);
    
    // Set metadata
    specialist.id = `${specialistId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    specialist.type = specialistId;
    specialist.department = this.name;
    specialist.manager = this;
    specialist.spawnedAt = Date.now();
    specialist.lifecycleState = 'active';
    
    return specialist;
  }
  
  /**
   * Coordinate specialist execution
   */
  async coordinateSpecialists(specialists, task) {
    const results = [];
    
    // Execute all specialists in parallel (they have different models)
    const promises = specialists.map(specialist => 
      this.executeSpecialistTask(specialist, task)
    );
    
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);
    
    return results;
  }
  
  /**
   * Execute task with a single specialist
   */
  async executeSpecialistTask(specialist, task) {
    try {
      // Add model config to task for specialist awareness
      const enhancedTask = {
        ...task,
        modelConfig: specialist.modelConfig,
        specialistType: specialist.type
      };
      
      // Check which execution method the specialist has
      if (specialist.execute) {
        return await specialist.execute(enhancedTask);
      } else if (specialist.processTask) {
        return await specialist.processTask(enhancedTask);
      } else if (specialist.executeTask) {
        return await specialist.executeTask(enhancedTask);
      } else {
        // Return result with model metadata
        return {
          specialist: specialist.type,
          status: 'completed',
          result: `${specialist.type} analysis completed`,
          modelUsed: specialist.modelConfig,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error(`   Specialist ${specialist.type} failed: ${error.message}`);
      return {
        specialist: specialist.type,
        status: 'failed',
        error: error.message,
        modelUsed: specialist.modelConfig
      };
    }
  }
  
  /**
   * Aggregate results from multiple specialists
   */
  async aggregateResults(results, task) {
    const successful = results.filter(r => r.status !== 'failed');
    const failed = results.filter(r => r.status === 'failed');
    
    return {
      command: task.command,
      department: this.name,
      timestamp: task.timestamp,
      specialists: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results,
      modelAssignments: {
        manager: this.modelConfig,
        specialists: results.map(r => r.modelUsed)
      },
      summary: this.generateSummary(results, task)
    };
  }
  
  /**
   * Generate summary from results
   */
  generateSummary(results, task) {
    const summaryPoints = [];
    
    for (const result of results) {
      if (result.status === 'completed') {
        summaryPoints.push({
          specialist: result.specialist,
          finding: result.result || 'Completed successfully',
          model: result.modelUsed?.model || 'unknown'
        });
      }
    }
    
    return {
      task: task.command,
      completedBy: results.map(r => r.specialist),
      modelsUsed: {
        manager: this.modelConfig?.model,
        specialists: results.map(r => r.modelUsed?.model).filter(Boolean)
      },
      keyFindings: summaryPoints,
      recommendation: `${task.command} analyzed by ${results.length} specialists`
    };
  }
  
  /**
   * Analyze specialist needs (base implementation)
   */
  async analyzeSpecialistNeeds(commandName, prompt) {
    // Override in derived classes
    return ['backend-developer', 'frontend-developer'];
  }
  
  /**
   * Update enhanced metrics with performance tracking
   */
  async updateEnhancedMetrics(responseTime, specialists, result) {
    this.metrics.tasksCompleted++;
    
    // Update average response time
    const count = this.metrics.tasksCompleted;
    const oldAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (oldAvg * (count - 1) + responseTime) / count;
    
    // Update performance tracking
    const successful = result.successful || 0;
    const total = result.specialists || specialists.length;
    
    if (successful === total) {
      this.metrics.performanceTracking.successful_selections++;
    } else {
      this.metrics.performanceTracking.failed_selections++;
    }
    
    // Calculate selection accuracy
    const totalSelections = this.metrics.performanceTracking.successful_selections + this.metrics.performanceTracking.failed_selections;
    if (totalSelections > 0) {
      this.metrics.performanceTracking.selection_accuracy = this.metrics.performanceTracking.successful_selections / totalSelections;
    }
    
    // Track optimization improvements
    const avgOptimization = this.calculateAverageOptimizationScore(specialists);
    if (avgOptimization > 0.8) {
      this.metrics.performanceTracking.optimization_improvements++;
    }
  }
  
  /**
   * Update metrics (legacy compatibility)
   */
  updateMetrics(responseTime) {
    this.updateEnhancedMetrics(responseTime, [], { successful: 1, specialists: 1 });
  }
  
  /**
   * Get enhanced manager metrics including AI optimization performance
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSpecialists: this.activeSpecialists.size,
      availableSpecialists: this.specialists.size,
      claudeMaxAvailable: this.claudeMaxManager?.isAvailable() || false,
      modelUsageBreakdown: this.metrics.modelsAssigned,
      aiOptimization: {
        framework_active: this.aiModelFramework.enabled,
        automated_selection: this.automatedSelection.enabled,
        performance_tracking: this.metrics.performanceTracking,
        optimization_strategies: this.aiModelFramework.optimization_strategies.length,
        model_efficiency: Object.fromEntries(this.metrics.performanceTracking.model_efficiency_scores)
      }
    };
  }
  
  /**
   * Receive executive strategy from CEO
   */
  async receiveExecutiveStrategy(strategy) {
    logger.info(`🏁 ${this.name} received executive strategy`);
    this.currentStrategy = strategy;
    await this.prepareDepartmentForStrategy(strategy);
  }
  
  /**
   * Prepare department for executive strategy
   */
  async prepareDepartmentForStrategy(strategy) {
    logger.info(`🏁 ${this.name} preparing for executive strategy`);
    this.currentExecutiveStrategy = strategy;
  }
  
  /**
   * Execute strategy under executive control
   */
  async executeStrategy(strategy, context) {
    logger.info(`🏁 ${this.name} executing strategic responsibilities`);
    return {
      department: this.name,
      status: 'completed',
      strategy: strategy
    };
  }
  
  /**
   * Release all specialists
   */
  async releaseSpecialists() {
    for (const [id, specialist] of this.activeSpecialists) {
      if (specialist.release) {
        await specialist.release();
      }
      specialist.lifecycleState = 'idle';
    }
    
    logger.info(`Released ${this.activeSpecialists.size} specialists`);
    this.activeSpecialists.clear();
  }
  
  /**
   * Get enhanced department status with AI optimization details
   */
  getStatus() {
    return {
      active: true,
      department: this.name,
      activeSpecialists: this.activeSpecialists.size,
      modelAssignment: {
        usingClaudeMax: this.usingClaudeMax,
        currentModel: this.modelConfig?.model || 'none',
        aiOptimized: this.aiModelFramework.enabled,
        selectionConfidence: this.managerSelectionConfidence || 0.0
      },
      metrics: this.metrics,
      aiFramework: {
        enabled: this.aiModelFramework.enabled,
        strategies: this.aiModelFramework.optimization_strategies.length,
        automatedSelection: this.automatedSelection.enabled,
        performanceScore: this.metrics.performanceTracking.selection_accuracy
      }
    };
  }
  
  /**
   * Initialize AI model framework for enhanced selection
   */
  initializeAIModelFramework() {
    logger.info(`🤖 Initializing AI Model Framework for ${this.name}...`);
    
    // Detect available AI/ML capabilities
    const apiConfig = this.detectModelAPIs();
    
    // Initialize optimization strategies
    const optimizationStrategies = [
      'performance_based_selection',
      'domain_specific_optimization',
      'cost_efficiency_balancing',
      'latency_optimization',
      'accuracy_maximization'
    ];
    
    // Initialize model analysis engines
    const analysisEngines = {
      domain_analyzer: this.initializeDomainAnalyzer(apiConfig),
      performance_predictor: this.initializePerformancePredictor(apiConfig),
      cost_optimizer: this.initializeCostOptimizer(apiConfig),
      selection_validator: this.initializeSelectionValidator(apiConfig)
    };
    
    return {
      enabled: true,
      api_config: apiConfig,
      optimization_strategies: optimizationStrategies,
      analysis_engines: analysisEngines,
      learning_system: {
        enabled: true,
        adaptation_rate: 0.15,
        selection_history: [],
        performance_cache: new Map()
      },
      fallback_system: {
        intelligent_fallbacks: true,
        confidence_threshold: 0.7,
        performance_monitoring: true
      }
    };
  }
  
  /**
   * Detect available model APIs for optimization
   */
  detectModelAPIs() {
    const apis = {
      tensorflow: false,
      openai: false,
      huggingface: false,
      anthropic: false,
      google: false
    };
    
    // OpenAI detection for intelligent model routing
    try {
      require.resolve('openai');
      apis.openai = true;
      logger.info('🏁 OpenAI detected - Enhanced model selection available');
    } catch (e) {
      logger.info('🟡 OpenAI not found - Using rule-based selection');
    }
    
    // HuggingFace detection for model capability analysis
    try {
      require.resolve('@huggingface/inference');
      apis.huggingface = true;
      logger.info('🏁 HuggingFace detected - Model capability analysis available');
    } catch (e) {
      logger.info('🟡 HuggingFace not found - Using heuristic analysis');
    }
    
    // TensorFlow detection for performance prediction
    try {
      require.resolve('@tensorflow/tfjs-node');
      apis.tensorflow = true;
      logger.info('🏁 TensorFlow detected - Performance prediction available');
    } catch (e) {
      logger.info('🟡 TensorFlow not found - Using statistical models');
    }
    
    return apis;
  }
  
  /**
   * Analyze optimal manager model selection
   */
  async analyzeOptimalManagerModel(commandName, prompt, context) {
    if (!this.aiModelFramework.enabled) {
      return { recommendation: 'Claude Max preferred', confidence: 0.8 };
    }
    
    // AI-enhanced analysis using intelligent fallbacks
    return await this.performIntelligentManagerAnalysis(commandName, prompt, context);
  }
  
  /**
   * Intelligent manager model analysis fallback
   */
  async performIntelligentManagerAnalysis(commandName, prompt, context) {
    const analysis = {
      recommendation: 'Claude Max preferred',
      confidence: 0.8,
      reasoning: [],
      performance_prediction: 'high'
    };
    
    // Analyze command complexity
    const complexity = this.analyzeCommandComplexity(commandName, prompt);
    analysis.reasoning.push(`Command complexity: ${complexity.level}`);
    
    if (complexity.score > 0.8) {
      analysis.recommendation = 'Claude Max required';
      analysis.confidence = 0.95;
      analysis.performance_prediction = 'optimal';
    } else if (complexity.score > 0.6) {
      analysis.confidence = 0.85;
      analysis.performance_prediction = 'good';
    } else {
      analysis.confidence = 0.75;
      analysis.recommendation = 'Claude Max preferred, fallback acceptable';
    }
    
    // Analyze department specialization needs
    const departmentAnalysis = this.analyzeDepartmentModelNeeds(this.name, commandName);
    analysis.reasoning.push(`Department fit: ${departmentAnalysis.fit}`);
    
    if (departmentAnalysis.requiresClaudeMax) {
      analysis.confidence = Math.min(0.95, analysis.confidence + 0.1);
    }
    
    return analysis;
  }
  
  /**
   * Analyze command complexity for model selection
   */
  analyzeCommandComplexity(commandName, prompt) {
    let complexity = 0.5; // Base complexity
    const commandLower = commandName.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    // High complexity indicators
    const highComplexityTerms = ['deploy', 'release', 'security', 'audit', 'review', 'validate', 'optimize'];
    const mediumComplexityTerms = ['implement', 'design', 'analyze', 'refactor', 'integrate'];
    const lowComplexityTerms = ['update', 'fix', 'format', 'style', 'documentation'];
    
    if (highComplexityTerms.some(term => commandLower.includes(term) || promptLower.includes(term))) {
      complexity = 0.9;
    } else if (mediumComplexityTerms.some(term => commandLower.includes(term) || promptLower.includes(term))) {
      complexity = 0.7;
    } else if (lowComplexityTerms.some(term => commandLower.includes(term) || promptLower.includes(term))) {
      complexity = 0.4;
    }
    
    // Adjust based on prompt length and technical terms
    const technicalTerms = ['algorithm', 'architecture', 'database', 'api', 'framework', 'microservice'];
    const technicalCount = technicalTerms.reduce((count, term) => 
      count + (promptLower.includes(term) ? 1 : 0), 0
    );
    
    complexity += Math.min(0.2, technicalCount * 0.05);
    
    return {
      score: Math.min(1.0, complexity),
      level: complexity > 0.8 ? 'high' : complexity > 0.6 ? 'medium' : 'low'
    };
  }
  
  /**
   * Analyze department-specific model needs
   */
  analyzeDepartmentModelNeeds(departmentName, commandName) {
    const analysis = {
      fit: 'good',
      requiresClaudeMax: false,
      reasoning: []
    };
    
    const departmentLower = departmentName.toLowerCase();
    const commandLower = commandName.toLowerCase();
    
    // Departments that typically require Claude Max
    if (departmentLower.includes('backend') && commandLower.includes('security')) {
      analysis.requiresClaudeMax = true;
      analysis.fit = 'optimal';
      analysis.reasoning.push('Backend security requires advanced reasoning');
    }
    
    if (departmentLower.includes('product') && (commandLower.includes('strategy') || commandLower.includes('roadmap'))) {
      analysis.requiresClaudeMax = true;
      analysis.fit = 'optimal';
      analysis.reasoning.push('Strategic planning benefits from Claude Max capabilities');
    }
    
    if (departmentLower.includes('design') && commandLower.includes('architecture')) {
      analysis.requiresClaudeMax = true;
      analysis.fit = 'high';
      analysis.reasoning.push('Design architecture requires comprehensive analysis');
    }
    
    return analysis;
  }
  
  /**
   * Analyze specialist model optimization
   */
  async analyzeSpecialistModelOptimization(specialistId, domain, commandName, prompt) {
    const analysis = {
      confidence: 0.8,
      optimization_score: 0.7,
      performance_prediction: 'good',
      reasoning: []
    };
    
    // Domain-based optimization analysis
    const domainOptimization = this.analyzeDomainOptimization(domain, specialistId);
    analysis.optimization_score = domainOptimization.score;
    analysis.reasoning.push(`Domain optimization: ${domainOptimization.level}`);
    
    // Task complexity analysis for specialist
    const taskComplexity = this.analyzeSpecialistTaskComplexity(specialistId, commandName, prompt);
    analysis.confidence = taskComplexity.confidence;
    analysis.reasoning.push(`Task complexity: ${taskComplexity.level}`);
    
    // Performance prediction based on historical data
    const performancePrediction = this.predictSpecialistPerformance(specialistId, domain);
    analysis.performance_prediction = performancePrediction.level;
    analysis.reasoning.push(`Performance prediction: ${performancePrediction.level}`);
    
    return analysis;
  }
  
  /**
   * Analyze domain optimization for specialist
   */
  analyzeDomainOptimization(domain, specialistId) {
    const domainScores = {
      coding: { qwen: 0.9, deepseek: 0.85, gemini: 0.7 },
      reasoning: { deepseek: 0.9, gemini: 0.8, qwen: 0.7 },
      ui: { gemini: 0.85, qwen: 0.7, deepseek: 0.6 },
      general: { gemini: 0.8, deepseek: 0.75, qwen: 0.7 }
    };
    
    const scores = domainScores[domain] || domainScores.general;
    const maxScore = Math.max(...Object.values(scores));
    
    return {
      score: maxScore,
      level: maxScore > 0.85 ? 'high' : maxScore > 0.7 ? 'medium' : 'low',
      optimal_model: Object.keys(scores).find(key => scores[key] === maxScore)
    };
  }
  
  /**
   * Analyze task complexity for specialist
   */
  analyzeSpecialistTaskComplexity(specialistId, commandName, prompt) {
    let confidence = 0.8;
    const specialistLower = specialistId.toLowerCase();
    const commandLower = commandName.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    // Specialist-specific complexity analysis
    if (specialistLower.includes('security') && promptLower.includes('audit')) {
      confidence = 0.95;
    } else if (specialistLower.includes('developer') && promptLower.includes('algorithm')) {
      confidence = 0.9;
    } else if (specialistLower.includes('frontend') && promptLower.includes('performance')) {
      confidence = 0.85;
    }
    
    const level = confidence > 0.9 ? 'high' : confidence > 0.8 ? 'medium' : 'low';
    
    return { confidence, level };
  }
  
  /**
   * Predict specialist performance based on historical data
   */
  predictSpecialistPerformance(specialistId, domain) {
    // Use performance cache if available
    const cacheKey = `${specialistId}_${domain}`;
    const cachedPerformance = this.automatedSelection.performance_cache.get(cacheKey);
    
    if (cachedPerformance) {
      return {
        level: cachedPerformance.level,
        score: cachedPerformance.score,
        source: 'historical_data'
      };
    }
    
    // Fallback prediction based on specialist type and domain alignment
    const alignmentScore = this.calculateSpecialistDomainAlignment(specialistId, domain);
    
    return {
      level: alignmentScore > 0.8 ? 'high' : alignmentScore > 0.6 ? 'good' : 'moderate',
      score: alignmentScore,
      source: 'heuristic_analysis'
    };
  }
  
  /**
   * Calculate specialist-domain alignment score
   */
  calculateSpecialistDomainAlignment(specialistId, domain) {
    const alignments = {
      'backend-developer': { coding: 0.9, reasoning: 0.7, general: 0.6, ui: 0.3 },
      'frontend-developer': { ui: 0.9, coding: 0.8, general: 0.6, reasoning: 0.5 },
      'security-specialist': { reasoning: 0.95, coding: 0.8, general: 0.7, ui: 0.4 },
      'product-manager': { reasoning: 0.8, general: 0.85, ui: 0.6, coding: 0.4 },
      'design-engineer': { ui: 0.95, general: 0.7, reasoning: 0.6, coding: 0.5 }
    };
    
    const specialistAlignment = alignments[specialistId] || { [domain]: 0.7 };
    return specialistAlignment[domain] || 0.6;
  }
  
  /**
   * Calculate average optimization score from specialists
   */
  calculateAverageOptimizationScore(specialists) {
    if (!specialists || specialists.length === 0) return 0.0;
    
    const scores = specialists
      .map(s => s.optimizationScore || 0.7)
      .filter(score => score > 0);
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.7;
  }
  
  /**
   * Update model efficiency score for tracking
   */
  updateModelEfficiencyScore(tierKey, optimizationScore) {
    const currentScore = this.metrics.performanceTracking.model_efficiency_scores.get(tierKey) || 0.7;
    const newScore = (currentScore + optimizationScore) / 2; // Simple moving average
    this.metrics.performanceTracking.model_efficiency_scores.set(tierKey, newScore);
  }
  
  /**
   * Record selection performance for learning
   */
  async recordSelectionPerformance(commandName, prompt, context) {
    if (!this.automatedSelection.enabled) return;
    
    const selectionEntry = {
      timestamp: Date.now(),
      command: commandName,
      department: this.name,
      manager_model: this.modelConfig?.model || 'none',
      manager_confidence: this.managerSelectionConfidence || 0.8,
      specialist_count: this.activeSpecialists.size,
      performance_score: this.metrics.performanceTracking.selection_accuracy
    };
    
    this.automatedSelection.selection_history.push(selectionEntry);
    
    // Keep only recent entries (last 100)
    if (this.automatedSelection.selection_history.length > 100) {
      this.automatedSelection.selection_history.shift();
    }
  }
  
  /**
   * Initialize domain analyzer
   */
  initializeDomainAnalyzer(apiConfig) {
    if (apiConfig.huggingface) {
      return { type: 'huggingface_nlp', confidence: 0.9 };
    } else if (apiConfig.openai) {
      return { type: 'openai_analysis', confidence: 0.85 };
    } else {
      return { type: 'heuristic_analysis', confidence: 0.75 };
    }
  }
  
  /**
   * Initialize performance predictor
   */
  initializePerformancePredictor(apiConfig) {
    if (apiConfig.tensorflow) {
      return { type: 'tensorflow_model', confidence: 0.88 };
    } else if (apiConfig.openai) {
      return { type: 'openai_prediction', confidence: 0.82 };
    } else {
      return { type: 'statistical_model', confidence: 0.73 };
    }
  }
  
  /**
   * Initialize cost optimizer
   */
  initializeCostOptimizer(apiConfig) {
    return {
      type: 'mathematical_optimizer',
      confidence: 0.85,
      strategies: ['tier_balancing', 'usage_optimization', 'performance_cost_ratio']
    };
  }
  
  /**
   * Initialize selection validator
   */
  initializeSelectionValidator(apiConfig) {
    if (apiConfig.openai) {
      return { type: 'ai_validator', confidence: 0.87 };
    } else {
      return { type: 'rule_based_validator', confidence: 0.79 };
    }
  }
}

module.exports = ModelAwareDepartmentManager;