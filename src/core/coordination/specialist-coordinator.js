/**
 * Specialist Coordinator
 * Enhanced coordination for multi-specialist task execution
 * Sprint 2: Department Manager Enhancement
 */

const { logger } = require('../logging/bumba-logger');
const EventEmitter = require('events');

/**
 * Coordination strategies for specialist collaboration
 */
const CoordinationStrategy = {
  SEQUENTIAL: 'sequential',     // One specialist at a time
  PARALLEL: 'parallel',         // All specialists work simultaneously
  PIPELINE: 'pipeline',         // Output of one feeds into next
  CONSENSUS: 'consensus',       // All specialists vote on solution
  HIERARCHICAL: 'hierarchical'  // Lead specialist coordinates others
};

/**
 * Specialist Coordinator
 * Manages multi-specialist task execution with intelligent routing
 */
class SpecialistCoordinator extends EventEmitter {
  constructor(department, options = {}) {
    super();
    this.department = department;
    this.options = {
      maxConcurrent: 3,
      timeout: 30000,
      retryCount: 2,
      enableCollaboration: true,
      ...options
    };
    
    this.activeTasks = new Map();
    this.completedTasks = new Map();
    this.metrics = {
      tasksCoordinated: 0,
      specialistsUsed: 0,
      collaborations: 0,
      averageResponseTime: 0,
      successRate: 0
    };
    
    logger.info(`🟡 Specialist Coordinator initialized for ${department}`);
  }
  
  /**
   * Coordinate task execution across multiple specialists
   */
  async coordinateTask(task, specialists, strategy = CoordinationStrategy.PARALLEL) {
    const taskId = this.generateTaskId();
    const startTime = Date.now();
    
    logger.info(`🟢 Coordinating task ${taskId} with ${specialists.length} specialists`);
    logger.info(`   Strategy: ${strategy}`);
    
    this.activeTasks.set(taskId, {
      task,
      specialists,
      strategy,
      startTime,
      status: 'active'
    });
    
    try {
      let result;
      
      switch (strategy) {
        case CoordinationStrategy.SEQUENTIAL:
          result = await this.executeSequential(task, specialists);
          break;
          
        case CoordinationStrategy.PARALLEL:
          result = await this.executeParallel(task, specialists);
          break;
          
        case CoordinationStrategy.PIPELINE:
          result = await this.executePipeline(task, specialists);
          break;
          
        case CoordinationStrategy.CONSENSUS:
          result = await this.executeConsensus(task, specialists);
          break;
          
        case CoordinationStrategy.HIERARCHICAL:
          result = await this.executeHierarchical(task, specialists);
          break;
          
        default:
          result = await this.executeParallel(task, specialists);
      }
      
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(responseTime, specialists.length, true);
      
      // Store completed task
      this.completedTasks.set(taskId, {
        ...this.activeTasks.get(taskId),
        result,
        responseTime,
        completedAt: Date.now(),
        status: 'completed'
      });
      
      this.activeTasks.delete(taskId);
      
      logger.info(`🏁 Task ${taskId} completed in ${responseTime}ms`);
      
      return {
        success: true,
        taskId,
        strategy,
        responseTime,
        result
      };
      
    } catch (error) {
      logger.error(`🔴 Task ${taskId} failed: ${error.message}`);
      
      this.updateMetrics(Date.now() - startTime, specialists.length, false);
      
      this.activeTasks.delete(taskId);
      
      return {
        success: false,
        taskId,
        error: error.message
      };
    }
  }
  
  /**
   * Execute specialists sequentially
   */
  async executeSequential(task, specialists) {
    const results = [];
    let currentInput = task;
    
    for (const specialist of specialists) {
      logger.info(`   Sequential: ${specialist.name || specialist.id} processing...`);
      
      const result = await this.executeSpecialist(specialist, currentInput);
      results.push(result);
      
      // Use output as input for next specialist
      if (result.output) {
        currentInput = {
          ...task,
          previousOutput: result.output
        };
      }
    }
    
    return this.aggregateResults(results);
  }
  
  /**
   * Execute specialists in parallel
   */
  async executeParallel(task, specialists) {
    logger.info(`   Parallel: Executing ${specialists.length} specialists simultaneously`);
    
    const promises = specialists.map(specialist => 
      this.executeSpecialist(specialist, task)
    );
    
    const results = await Promise.all(promises);
    
    return this.aggregateResults(results);
  }
  
  /**
   * Execute specialists in pipeline mode
   */
  async executePipeline(task, specialists) {
    let pipelineData = task;
    const results = [];
    
    for (const specialist of specialists) {
      logger.info(`   Pipeline: ${specialist.name || specialist.id} processing stage...`);
      
      const result = await this.executeSpecialist(specialist, pipelineData);
      results.push(result);
      
      // Transform data for next stage
      pipelineData = {
        ...pipelineData,
        stageOutput: result.output,
        previousStage: specialist.name || specialist.id
      };
    }
    
    return {
      pipeline: results,
      finalOutput: results[results.length - 1].output
    };
  }
  
  /**
   * Execute specialists with consensus voting
   */
  async executeConsensus(task, specialists) {
    logger.info(`   Consensus: Gathering opinions from ${specialists.length} specialists`);
    
    const results = await this.executeParallel(task, specialists);
    
    // Analyze consensus
    const votes = new Map();
    results.forEach(result => {
      if (result.recommendation) {
        const vote = JSON.stringify(result.recommendation);
        votes.set(vote, (votes.get(vote) || 0) + 1);
      }
    });
    
    // Find majority opinion
    let maxVotes = 0;
    let consensus = null;
    votes.forEach((count, vote) => {
      if (count > maxVotes) {
        maxVotes = count;
        consensus = JSON.parse(vote);
      }
    });
    
    return {
      individualResults: results,
      consensus,
      agreement: maxVotes / specialists.length
    };
  }
  
  /**
   * Execute with hierarchical coordination
   */
  async executeHierarchical(task, specialists) {
    if (specialists.length === 0) return null;
    
    const [lead, ...subordinates] = specialists;
    
    logger.info(`   Hierarchical: ${lead.name || lead.id} leading ${subordinates.length} specialists`);
    
    // Lead specialist analyzes and delegates
    const leadAnalysis = await this.executeSpecialist(lead, {
      ...task,
      role: 'lead',
      subordinates: subordinates.map(s => s.name || s.id)
    });
    
    // Subordinates execute based on lead's direction
    const subordinateResults = await Promise.all(
      subordinates.map(specialist => 
        this.executeSpecialist(specialist, {
          ...task,
          leadGuidance: leadAnalysis.output
        })
      )
    );
    
    // Lead synthesizes results
    const synthesis = await this.executeSpecialist(lead, {
      ...task,
      role: 'synthesize',
      subordinateResults
    });
    
    return {
      leadAnalysis,
      subordinateResults,
      synthesis: synthesis.output
    };
  }
  
  /**
   * Execute a single specialist
   */
  async executeSpecialist(specialist, task) {
    try {
      const startTime = Date.now();
      
      // Execute specialist
      let result;
      if (specialist.execute) {
        result = await specialist.execute(task);
      } else if (specialist.processTask) {
        result = await specialist.processTask(task);
      } else {
        result = { success: false, error: 'No execution method available' };
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        specialist: specialist.name || specialist.id,
        success: result.success !== false,
        output: result.response || result.output || result,
        recommendation: result.recommendation,
        confidence: result.confidence,
        responseTime
      };
      
    } catch (error) {
      logger.error(`Specialist execution failed: ${error.message}`);
      return {
        specialist: specialist.name || specialist.id,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Aggregate results from multiple specialists
   */
  aggregateResults(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      totalSpecialists: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      summary: this.generateSummary(successful),
      errors: failed.map(r => ({ specialist: r.specialist, error: r.error }))
    };
  }
  
  /**
   * Generate summary from successful results
   */
  generateSummary(results) {
    if (results.length === 0) return null;
    
    // Combine outputs
    const outputs = results.map(r => r.output).filter(Boolean);
    
    // Calculate average confidence
    const confidences = results.map(r => r.confidence).filter(Boolean);
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
    
    return {
      combinedOutput: outputs.join('\n---\n'),
      averageConfidence: avgConfidence,
      specialistsInvolved: results.map(r => r.specialist)
    };
  }
  
  /**
   * Enable collaboration between specialists
   */
  async enableCollaboration(specialist1, specialist2, task) {
    if (!this.options.enableCollaboration) return null;
    
    logger.info(`🤝 Enabling collaboration: ${specialist1.name} <-> ${specialist2.name}`);
    
    // Allow specialists to share context
    const sharedContext = {
      task,
      specialist1: specialist1.name,
      specialist2: specialist2.name,
      timestamp: Date.now()
    };
    
    // Execute collaborative task
    const result1 = await specialist1.collaborate?.(specialist2, sharedContext);
    const result2 = await specialist2.collaborate?.(specialist1, sharedContext);
    
    this.metrics.collaborations++;
    
    return {
      collaboration: true,
      participants: [specialist1.name, specialist2.name],
      results: [result1, result2]
    };
  }
  
  /**
   * Update coordination metrics
   */
  updateMetrics(responseTime, specialistCount, success) {
    this.metrics.tasksCoordinated++;
    this.metrics.specialistsUsed += specialistCount;
    
    // Update average response time
    const count = this.metrics.tasksCoordinated;
    const oldAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (oldAvg * (count - 1) + responseTime) / count;
    
    // Update success rate
    if (success) {
      const successCount = Math.floor(this.metrics.successRate * (count - 1));
      this.metrics.successRate = (successCount + 1) / count;
    } else {
      const successCount = Math.floor(this.metrics.successRate * (count - 1));
      this.metrics.successRate = successCount / count;
    }
  }
  
  /**
   * Generate task ID
   */
  generateTaskId() {
    return `task-${this.department}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size
    };
  }
  
  /**
   * Clear completed tasks
   */
  clearHistory() {
    this.completedTasks.clear();
    logger.info('📝 Task history cleared');
  }
}

module.exports = {
  SpecialistCoordinator,
  CoordinationStrategy
};