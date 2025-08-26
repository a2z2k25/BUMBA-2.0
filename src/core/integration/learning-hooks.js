/**
 * BUMBA Learning Hooks
 * Injects learning capabilities into all BUMBA operations
 */

const { logger } = require('../logging/bumba-logger');

class LearningHooks {
  constructor(consciousness) {
    this.consciousness = consciousness;
    this.hooks = new Map();
    this.initialized = false;
  }

  /**
   * Initialize learning hooks across BUMBA
   */
  async initialize() {
    logger.info('🟢 Installing BUMBA learning hooks...');
    
    // Initialize core learning hooks
    this.initializeLearningHooks();
    
    // Hook into routing system
    await this.hookRoutingSystem();
    
    // Hook into specialist operations
    await this.hookSpecialistOperations();
    
    // Hook into department coordination
    await this.hookDepartmentCoordination();
    
    // Hook into error handling
    await this.hookErrorHandling();
    
    // Hook into audio system
    await this.hookAudioSystem();
    
    this.initialized = true;
    logger.info('🏁 Learning hooks installed');
  }

  /**
   * Initialize core learning hooks
   */
  initializeLearningHooks() {
    // Learning capture hook
    this.createHook('learning:capture', {
      before: async (context) => {
        context.captureStartTime = Date.now();
        context.initialState = this.captureSystemState();
        return context;
      },
      after: async (context, result) => {
        const experience = {
          timestamp: Date.now(),
          duration: Date.now() - context.captureStartTime,
          initialState: context.initialState,
          finalState: this.captureSystemState(),
          result: result,
          patterns: this.extractPatterns(context, result)
        };
        await this.storeExperience(experience);
        return result;
      }
    });

    // Learning optimization hook
    this.createHook('learning:optimize', {
      before: async (context) => {
        context.optimizationSuggestions = await this.getOptimizationSuggestions(context);
        return context;
      },
      after: async (context, result) => {
        if (context.optimizationSuggestions?.length > 0) {
          await this.applyOptimizations(context.optimizationSuggestions, result);
        }
        return result;
      }
    });

    // Feedback processing hook
    this.createHook('learning:feedback', {
      before: async (context) => {
        context.previousFeedback = await this.getPreviousFeedback(context.type);
        return context;
      },
      after: async (context, result) => {
        await this.processFeedback({
          type: context.type,
          feedback: context.feedback,
          result: result,
          timestamp: Date.now()
        });
        return result;
      }
    });

    // Continuous improvement hook
    this.createHook('learning:improve', {
      before: async (context) => {
        context.improvementMetrics = await this.getImprovementMetrics();
        context.baselinePerformance = await this.getBaselinePerformance(context.operation);
        return context;
      },
      after: async (context, result) => {
        const improvement = await this.measureImprovement(
          context.baselinePerformance,
          result
        );
        if (improvement.significant) {
          await this.recordImprovement(context.operation, improvement);
          logger.info(`📈 Performance improved by ${improvement.percentage}% for ${context.operation}`);
        }
        return result;
      }
    });

    logger.info('🟡 Core learning hooks initialized');
  }

  /**
   * Capture current system state for learning
   */
  captureSystemState() {
    return {
      timestamp: Date.now(),
      activeAgents: this.getActiveAgentCount(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Extract patterns from context and result
   */
  extractPatterns(context, result) {
    const patterns = [];
    
    // Extract success patterns
    if (result?.success) {
      patterns.push({
        type: 'success_pattern',
        context: context.type,
        factors: this.identifySuccessFactors(context, result)
      });
    }
    
    // Extract failure patterns
    if (result?.error) {
      patterns.push({
        type: 'failure_pattern',
        context: context.type,
        factors: this.identifyFailureFactors(context, result)
      });
    }
    
    return patterns;
  }

  /**
   * Store learning experience
   */
  async storeExperience(experience) {
    if (this.consciousness?.recordExperience) {
      await this.consciousness.recordExperience({
        type: 'learning_capture',
        ...experience
      });
    }
    
    // Also store locally
    if (!this.experiences) {
      this.experiences = [];
    }
    this.experiences.push(experience);
    
    // Keep only last 1000 experiences
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-1000);
    }
  }

  /**
   * Get optimization suggestions based on context
   */
  async getOptimizationSuggestions(context) {
    const suggestions = [];
    
    // Analyze past experiences for patterns
    if (this.experiences?.length > 0) {
      const similar = this.experiences.filter(exp => 
        exp.patterns?.some(p => p.context === context.type)
      );
      
      if (similar.length > 0) {
        // Find common success factors
        const successFactors = similar
          .filter(exp => exp.result?.success)
          .flatMap(exp => exp.patterns?.filter(p => p.type === 'success_pattern'))
          .map(p => p.factors)
          .flat();
        
        if (successFactors.length > 0) {
          suggestions.push({
            type: 'apply_success_pattern',
            factors: this.getMostCommonFactors(successFactors)
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Apply optimization suggestions
   */
  async applyOptimizations(suggestions, result) {
    for (const suggestion of suggestions) {
      try {
        if (suggestion.type === 'apply_success_pattern') {
          // Store for future reference
          result.appliedOptimizations = suggestion.factors;
        }
      } catch (error) {
        logger.warn(`Failed to apply optimization: ${error.message}`);
      }
    }
  }

  /**
   * Process feedback for learning
   */
  async processFeedback(feedbackData) {
    if (this.consciousness?.processFeedback) {
      await this.consciousness.processFeedback(feedbackData);
    }
    
    // Store feedback locally
    if (!this.feedbackHistory) {
      this.feedbackHistory = [];
    }
    this.feedbackHistory.push(feedbackData);
  }

  /**
   * Get improvement metrics
   */
  async getImprovementMetrics() {
    return {
      totalExperiences: this.experiences?.length || 0,
      successRate: this.calculateSuccessRate(),
      averagePerformance: this.calculateAveragePerformance()
    };
  }

  /**
   * Helper methods
   */
  getActiveAgentCount() {
    // Placeholder - would connect to actual agent manager
    return 0;
  }

  identifySuccessFactors(context, result) {
    return ['timely_execution', 'correct_routing', 'efficient_coordination'];
  }

  identifyFailureFactors(context, result) {
    return ['timeout', 'resource_exhaustion', 'invalid_input'];
  }

  getMostCommonFactors(factors) {
    const frequency = {};
    factors.forEach(f => {
      frequency[f] = (frequency[f] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor]) => factor);
  }

  calculateSuccessRate() {
    if (!this.experiences?.length) return 0;
    const successful = this.experiences.filter(exp => exp.result?.success).length;
    return (successful / this.experiences.length) * 100;
  }

  calculateAveragePerformance() {
    if (!this.experiences?.length) return 0;
    const totalDuration = this.experiences.reduce((sum, exp) => sum + (exp.duration || 0), 0);
    return totalDuration / this.experiences.length;
  }

  async getPreviousFeedback(type) {
    return this.feedbackHistory?.filter(f => f.type === type) || [];
  }

  async getBaselinePerformance(operation) {
    const relevant = this.experiences?.filter(exp => exp.operation === operation) || [];
    if (relevant.length === 0) return null;
    
    return {
      averageDuration: relevant.reduce((sum, exp) => sum + exp.duration, 0) / relevant.length,
      successRate: relevant.filter(exp => exp.result?.success).length / relevant.length
    };
  }

  async measureImprovement(baseline, result) {
    if (!baseline) return { significant: false };
    
    const currentDuration = result.duration || 0;
    const improvement = ((baseline.averageDuration - currentDuration) / baseline.averageDuration) * 100;
    
    return {
      significant: improvement > 10,
      percentage: Math.round(improvement)
    };
  }

  async recordImprovement(operation, improvement) {
    if (!this.improvements) {
      this.improvements = {};
    }
    
    if (!this.improvements[operation]) {
      this.improvements[operation] = [];
    }
    
    this.improvements[operation].push({
      timestamp: Date.now(),
      improvement: improvement.percentage
    });
  }

  /**
   * Hook into routing system
   */
  async hookRoutingSystem() {
    try {
      const UltraPreciseRouter = require('../ultra-precise-routing-system');
      
      // Hook route method
      const originalRoute = UltraPreciseRouter.prototype.route;
      UltraPreciseRouter.prototype.route = async function(query) {
        const startTime = Date.now();
        
        try {
          const result = await originalRoute.call(this, query);
          
          // Record successful routing
          await this.consciousness?.recordExperience({
            type: 'routing',
            context: {
              query_type: query.type,
              complexity: query.complexity || 'medium',
              department: result.department,
              specialist: result.specialist?.type
            },
            action: {
              type: 'route_query',
              method: 'ultra_precise'
            },
            outcome: {
              type: 'success',
              confidence: result.confidence,
              department: result.department
            },
            success: true,
            duration: Date.now() - startTime
          });
          
          return result;
        } catch (error) {
          // Record routing failure
          await this.consciousness?.recordExperience({
            type: 'routing',
            context: {
              query_type: query.type,
              error: error.message
            },
            action: {
              type: 'route_query',
              method: 'ultra_precise'
            },
            outcome: {
              type: 'error',
              error: error.message
            },
            success: false,
            duration: Date.now() - startTime
          });
          
          throw error;
        }
      }.bind(this);
      
      logger.info('🏁 Routing system hooks installed');
    } catch (error) {
      logger.warn('Could not hook routing system:', error.message);
    }
  }

  /**
   * Hook into specialist operations
   */
  async hookSpecialistOperations() {
    try {
      const BaseSpecialist = require('../specialists/base-specialist');
      
      // Hook process method
      const originalProcess = BaseSpecialist.prototype.process;
      BaseSpecialist.prototype.process = async function(task, context) {
        const startTime = Date.now();
        const specialistType = this.type || 'unknown';
        
        try {
          const result = await originalProcess.call(this, task, context);
          
          // Record specialist success
          await this.consciousness?.recordExperience({
            type: 'specialist_task',
            context: {
              specialist: specialistType,
              task_type: task.type,
              department: this.department
            },
            action: {
              type: 'process_task',
              specialist: specialistType
            },
            outcome: {
              type: 'success',
              quality: result.quality || 0.8
            },
            success: true,
            duration: Date.now() - startTime
          });
          
          return result;
        } catch (error) {
          // Record specialist failure
          await this.consciousness?.recordExperience({
            type: 'specialist_task',
            context: {
              specialist: specialistType,
              task_type: task.type,
              error: error.message
            },
            action: {
              type: 'process_task',
              specialist: specialistType
            },
            outcome: {
              type: 'error',
              error: error.message
            },
            success: false,
            duration: Date.now() - startTime
          });
          
          throw error;
        }
      }.bind(this);
      
      logger.info('🏁 Specialist operation hooks installed');
    } catch (error) {
      logger.warn('Could not hook specialist operations:', error.message);
    }
  }

  /**
   * Hook into department coordination
   */
  async hookDepartmentCoordination() {
    try {
      const DepartmentProtocols = require('../coordination/department-protocols');
      
      // Hook coordination method
      const originalCoordinate = DepartmentProtocols.prototype.coordinateDepartments;
      DepartmentProtocols.prototype.coordinateDepartments = async function(task, departments, type, context) {
        const startTime = Date.now();
        
        try {
          const result = await originalCoordinate.call(this, task, departments, type, context);
          
          // Record coordination success
          await this.consciousness?.recordExperience({
            type: 'coordination',
            context: {
              task_type: task.type,
              departments: departments.map(d => d.name),
              coordination_type: type,
              participant_count: departments.length
            },
            action: {
              type: 'coordinate_departments',
              method: type
            },
            outcome: {
              type: 'success',
              phases_completed: result.phases?.length || 0,
              quality: result.quality_metrics
            },
            success: result.overall_success,
            duration: Date.now() - startTime
          });
          
          return result;
        } catch (error) {
          // Record coordination failure
          await this.consciousness?.recordExperience({
            type: 'coordination',
            context: {
              task_type: task.type,
              departments: departments.map(d => d.name),
              error: error.message
            },
            action: {
              type: 'coordinate_departments',
              method: type
            },
            outcome: {
              type: 'error',
              error: error.message
            },
            success: false,
            duration: Date.now() - startTime
          });
          
          throw error;
        }
      }.bind(this);
      
      logger.info('🏁 Department coordination hooks installed');
    } catch (error) {
      logger.warn('Could not hook department coordination:', error.message);
    }
  }

  /**
   * Hook into error handling
   */
  async hookErrorHandling() {
    try {
      const BumbaError = require('../error-handling/bumba-error-system').BumbaError;
      
      // Store original constructor
      const OriginalError = BumbaError;
      
      // Create wrapper
      global.BumbaError = class extends OriginalError {
        constructor(code, message, details) {
          super(code, message, details);
          
          // Record error occurrence
          setImmediate(async () => {
            await this.consciousness?.recordExperience({
              type: 'error',
              context: {
                error_code: code,
                error_type: this.name,
                stack: this.stack
              },
              action: {
                type: 'handle_error',
                code: code
              },
              outcome: {
                type: 'error_thrown',
                message: message
              },
              success: false
            });
          });
        }
      }.bind(this);
      
      logger.info('🏁 Error handling hooks installed');
    } catch (error) {
      logger.warn('Could not hook error handling:', error.message);
    }
  }

  /**
   * Hook into audio system
   */
  async hookAudioSystem() {
    try {
      const AudioSystem = require('../audio-fallback-system');
      
      // Hook play method
      const originalPlay = AudioSystem.play;
      AudioSystem.play = async function() {
        const result = await originalPlay.call(this);
        
        // Record audio feedback
        await this.consciousness?.recordExperience({
          type: 'audio_feedback',
          context: {
            audio_type: 'celebration',
            playback_method: result.method || 'unknown'
          },
          action: {
            type: 'play_audio'
          },
          outcome: {
            type: result.played ? 'success' : 'fallback',
            method: result.method
          },
          success: result.played
        });
        
        return result;
      }.bind(this);
      
      logger.info('🏁 Audio system hooks installed');
    } catch (error) {
      logger.warn('Could not hook audio system:', error.message);
    }
  }

  /**
   * Create custom hook
   */
  createHook(name, options = {}) {
    const hook = {
      name: name,
      before: options.before || null,
      after: options.after || null,
      onError: options.onError || null,
      enabled: true
    };
    
    this.hooks.set(name, hook);
    return hook;
  }

  /**
   * Wrap function with learning
   */
  wrapWithLearning(fn, experienceType, contextExtractor) {
    const consciousness = this.consciousness;
    
    return async function(...args) {
      const startTime = Date.now();
      const context = contextExtractor ? contextExtractor(...args) : {};
      
      try {
        const result = await fn.apply(this, args);
        
        // Record success
        await consciousness.recordExperience({
          type: experienceType,
          context: context,
          action: {
          },
          outcome: {
            type: 'success'
          },
          success: true,
          duration: Date.now() - startTime
        });
        
        return result;
      } catch (error) {
        // Record failure
        await consciousness.recordExperience({
          type: experienceType,
          context: {
            ...context,
            error: error.message
          },
          action: {
            type: fn.name || 'wrapped_function'
          },
          outcome: {
            type: 'error',
            error: error.message
          },
          success: false,
          duration: Date.now() - startTime
        });
        
        throw error;
      }
    };
  }

  /**
   * Hook into existing BUMBA instance
   */
  async hookBumbaInstance(bumba) {
    if (!bumba) {return;}
    
    // Hook main methods
    const methodsToHook = [
      'implementFeature',
      'explainCode', 
      'debugIssue',
      'optimizePerformance',
      'writeDocumentation'
    ];
    
    for (const method of methodsToHook) {
      if (typeof bumba[method] === 'function') {
        bumba[method] = this.wrapWithLearning(bumba[method], `bumba_${method}`, (request) => ({
            method: method,
            request_type: typeof request
          })
        );
      }
    }
    
    logger.info('🏁 BUMBA instance hooks installed');
  }

  /**
   * Get hook statistics
   */
  getStats() {
    return {
      hooks_installed: this.hooks.size,
      initialized: this.initialized
    };
  }
}

module.exports = { LearningHooks };