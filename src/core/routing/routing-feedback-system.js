/**
 * Routing Feedback System
 * Collects and processes feedback to improve routing decisions
 */

const { logger } = require('../logging/bumba-logger');
const EventEmitter = require('events');

class RoutingFeedbackSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    
    // Feedback stores
    this.executionFeedback = new Map(); // executionId -> feedback
    this.agentPerformance = new Map(); // agentName -> performance metrics
    this.modelQuality = new Map(); // model -> quality metrics
    
    // Feedback metrics
    this.metrics = {
      totalFeedback: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      neutralFeedback: 0,
      improvementSuggestions: []
    };
    
    // Quality thresholds
    this.thresholds = {
      minSuccessRate: config.minSuccessRate || 0.7,
      maxExecutionTime: config.maxExecutionTime || 30000,
      minConfidence: config.minConfidence || 0.6
    };
  }
  
  /**
   * Record execution feedback
   */
  async recordExecutionFeedback(executionId, feedback) {
    const enrichedFeedback = {
      ...feedback,
      executionId,
      timestamp: Date.now(),
      processed: false
    };
    
    this.executionFeedback.set(executionId, enrichedFeedback);
    
    // Process feedback immediately
    await this.processFeedback(enrichedFeedback);
    
    // Update metrics
    this.updateMetrics(enrichedFeedback);
    
    // Emit feedback event
    this.emit('feedback-received', enrichedFeedback);
    
    logger.info(`🟢 Recorded feedback for execution ${executionId}`, {
      success: feedback.success,
      executionTime: feedback.executionTime,
      agentCount: feedback.agents?.length
    });
    
    return enrichedFeedback;
  }
  
  /**
   * Process feedback to extract insights
   */
  async processFeedback(feedback) {
    // Update agent performance
    if (feedback.agents) {
      for (const agent of feedback.agents) {
        this.updateAgentPerformance(agent.name, {
          success: feedback.success,
          executionTime: feedback.executionTime,
          confidence: feedback.confidence
        });
      }
    }
    
    // Update model quality
    if (feedback.models) {
      for (const model of feedback.models) {
        this.updateModelQuality(model, {
          success: feedback.success,
          executionTime: feedback.executionTime,
          taskType: feedback.taskType
        });
      }
    }
    
    // Check for improvement opportunities
    const improvements = this.identifyImprovements(feedback);
    if (improvements.length > 0) {
      this.metrics.improvementSuggestions.push(...improvements);
      this.emit('improvements-identified', improvements);
    }
    
    feedback.processed = true;
  }
  
  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(agentName, metrics) {
    if (!this.agentPerformance.has(agentName)) {
      this.agentPerformance.set(agentName, {
        totalExecutions: 0,
        successfulExecutions: 0,
        totalExecutionTime: 0,
        averageConfidence: 0,
        recentPerformance: []
      });
    }
    
    const perf = this.agentPerformance.get(agentName);
    
    perf.totalExecutions++;
    if (metrics.success) {
      perf.successfulExecutions++;
    }
    perf.totalExecutionTime += metrics.executionTime || 0;
    
    // Update average confidence
    const totalConfidence = perf.averageConfidence * (perf.totalExecutions - 1);
    perf.averageConfidence = (totalConfidence + (metrics.confidence || 0)) / perf.totalExecutions;
    
    // Track recent performance (last 10)
    perf.recentPerformance.push({
      success: metrics.success,
      executionTime: metrics.executionTime,
      timestamp: Date.now()
    });
    
    if (perf.recentPerformance.length > 10) {
      perf.recentPerformance.shift();
    }
    
    // Calculate success rate
    perf.successRate = perf.successfulExecutions / perf.totalExecutions;
    perf.averageExecutionTime = perf.totalExecutionTime / perf.totalExecutions;
  }
  
  /**
   * Update model quality metrics
   */
  updateModelQuality(modelName, metrics) {
    if (!this.modelQuality.has(modelName)) {
      this.modelQuality.set(modelName, {
        totalTasks: 0,
        successfulTasks: 0,
        taskTypes: {},
        averageExecutionTime: 0,
        reliability: 1.0
      });
    }
    
    const quality = this.modelQuality.get(modelName);
    
    quality.totalTasks++;
    if (metrics.success) {
      quality.successfulTasks++;
    }
    
    // Track by task type
    const taskType = metrics.taskType || 'general';
    if (!quality.taskTypes[taskType]) {
      quality.taskTypes[taskType] = { total: 0, successful: 0 };
    }
    quality.taskTypes[taskType].total++;
    if (metrics.success) {
      quality.taskTypes[taskType].successful++;
    }
    
    // Update average execution time
    const totalTime = quality.averageExecutionTime * (quality.totalTasks - 1);
    quality.averageExecutionTime = (totalTime + (metrics.executionTime || 0)) / quality.totalTasks;
    
    // Calculate reliability score
    quality.reliability = quality.successfulTasks / quality.totalTasks;
  }
  
  /**
   * Identify improvement opportunities
   */
  identifyImprovements(feedback) {
    const improvements = [];
    
    // Check for slow execution
    if (feedback.executionTime > this.thresholds.maxExecutionTime) {
      improvements.push({
        type: 'performance',
        message: `Execution took ${feedback.executionTime}ms (threshold: ${this.thresholds.maxExecutionTime}ms)`,
        suggestion: 'Consider using faster models or optimizing the task'
      });
    }
    
    // Check for low confidence
    if (feedback.confidence && feedback.confidence < this.thresholds.minConfidence) {
      improvements.push({
        type: 'confidence',
        message: `Low routing confidence: ${feedback.confidence}`,
        suggestion: 'Provide more specific task details or break into smaller tasks'
      });
    }
    
    // Check for repeated failures
    if (!feedback.success && feedback.agents) {
      for (const agent of feedback.agents) {
        const perf = this.agentPerformance.get(agent.name);
        if (perf && perf.successRate < this.thresholds.minSuccessRate) {
          improvements.push({
            type: 'agent-performance',
            message: `Agent ${agent.name} has low success rate: ${(perf.successRate * 100).toFixed(1)}%`,
            suggestion: `Consider using alternative agents or reviewing ${agent.name}'s configuration`
          });
        }
      }
    }
    
    return improvements;
  }
  
  /**
   * Get performance report for an agent
   */
  getAgentPerformance(agentName) {
    const perf = this.agentPerformance.get(agentName);
    if (!perf) {
      return null;
    }
    
    return {
      agent: agentName,
      totalExecutions: perf.totalExecutions,
      successRate: `${(perf.successRate * 100).toFixed(1)}%`,
      averageExecutionTime: `${perf.averageExecutionTime.toFixed(0)}ms`,
      averageConfidence: perf.averageConfidence.toFixed(2),
      recentTrend: this.calculateTrend(perf.recentPerformance)
    };
  }
  
  /**
   * Get quality report for a model
   */
  getModelQuality(modelName) {
    const quality = this.modelQuality.get(modelName);
    if (!quality) {
      return null;
    }
    
    const taskTypeStats = {};
    for (const [type, stats] of Object.entries(quality.taskTypes)) {
      taskTypeStats[type] = {
        total: stats.total,
        successRate: `${((stats.successful / stats.total) * 100).toFixed(1)}%`
      };
    }
    
    return {
      model: modelName,
      totalTasks: quality.totalTasks,
      reliability: `${(quality.reliability * 100).toFixed(1)}%`,
      averageExecutionTime: `${quality.averageExecutionTime.toFixed(0)}ms`,
      taskTypes: taskTypeStats
    };
  }
  
  /**
   * Calculate performance trend
   */
  calculateTrend(recentPerformance) {
    if (recentPerformance.length < 2) {
      return 'stable';
    }
    
    const recentHalf = Math.floor(recentPerformance.length / 2);
    const firstHalf = recentPerformance.slice(0, recentHalf);
    const secondHalf = recentPerformance.slice(recentHalf);
    
    const firstSuccess = firstHalf.filter(p => p.success).length / firstHalf.length;
    const secondSuccess = secondHalf.filter(p => p.success).length / secondHalf.length;
    
    if (secondSuccess > firstSuccess + 0.1) {
      return 'improving';
    } else if (secondSuccess < firstSuccess - 0.1) {
      return 'declining';
    }
    
    return 'stable';
  }
  
  /**
   * Get feedback summary
   */
  getFeedbackSummary() {
    const agentReports = [];
    for (const [agent, _] of this.agentPerformance) {
      const report = this.getAgentPerformance(agent);
      if (report) {
        agentReports.push(report);
      }
    }
    
    const modelReports = [];
    for (const [model, _] of this.modelQuality) {
      const report = this.getModelQuality(model);
      if (report) {
        modelReports.push(report);
      }
    }
    
    return {
      metrics: this.metrics,
      topPerformingAgents: agentReports
        .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
        .slice(0, 5),
      modelQuality: modelReports,
      recentImprovements: this.metrics.improvementSuggestions.slice(-10),
      recommendations: this.generateRecommendations()
    };
  }
  
  /**
   * Generate recommendations based on feedback
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check for underperforming agents
    for (const [agent, perf] of this.agentPerformance) {
      if (perf.successRate < this.thresholds.minSuccessRate && perf.totalExecutions > 5) {
        recommendations.push({
          type: 'replace-agent',
          agent,
          reason: `Success rate ${(perf.successRate * 100).toFixed(1)}% is below threshold`,
          action: 'Consider replacing or retraining this agent'
        });
      }
    }
    
    // Check for slow models
    for (const [model, quality] of this.modelQuality) {
      if (quality.averageExecutionTime > this.thresholds.maxExecutionTime) {
        recommendations.push({
          type: 'optimize-model',
          model,
          reason: `Average execution time ${quality.averageExecutionTime.toFixed(0)}ms exceeds threshold`,
          action: 'Consider using a faster model for time-sensitive tasks'
        });
      }
    }
    
    // Check for task-model mismatches
    for (const [model, quality] of this.modelQuality) {
      for (const [taskType, stats] of Object.entries(quality.taskTypes)) {
        const successRate = stats.successful / stats.total;
        if (successRate < 0.5 && stats.total > 3) {
          recommendations.push({
            type: 'task-model-mismatch',
            model,
            taskType,
            reason: `Model ${model} performs poorly on ${taskType} tasks (${(successRate * 100).toFixed(1)}% success)`,
            action: `Use a different model for ${taskType} tasks`
          });
        }
      }
    }
    
    return recommendations;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(feedback) {
    this.metrics.totalFeedback++;
    
    if (feedback.success) {
      this.metrics.positiveFeedback++;
    } else if (feedback.success === false) {
      this.metrics.negativeFeedback++;
    } else {
      this.metrics.neutralFeedback++;
    }
  }
  
  /**
   * Clear old feedback
   */
  clearOldFeedback(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleared = 0;
    
    for (const [id, feedback] of this.executionFeedback) {
      if (now - feedback.timestamp > maxAge) {
        this.executionFeedback.delete(id);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      logger.info(`🟢️ Cleared ${cleared} old feedback entries`);
    }
  }
  
  /**
   * Reset all feedback data
   */
  reset() {
    this.executionFeedback.clear();
    this.agentPerformance.clear();
    this.modelQuality.clear();
    this.metrics = {
      totalFeedback: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      neutralFeedback: 0,
      improvementSuggestions: []
    };
    
    logger.info('🟢 Feedback system reset');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RoutingFeedbackSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new RoutingFeedbackSystem(config);
    }
    return instance;
  }
};