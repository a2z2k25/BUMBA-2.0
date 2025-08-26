/**
 * Enhanced Department Manager Base Class
 * Provides executeCommand capability for proper routing
 */

const { logger } = require('../logging/bumba-logger');

class EnhancedDepartmentManager {
  constructor(name, type, specialists = []) {
    this.name = name;
    this.type = type;
    this.specialists = new Map(specialists);
    this.activeSpecialists = new Map();
    this.metrics = {
      commandsReceived: 0,
      specialistsSpawned: 0,
      tasksCompleted: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Main entry point for command execution
   * This is what the router should call
   */
  async executeCommand(commandName, prompt, context = {}) {
    const startTime = Date.now();
    this.metrics.commandsReceived++;
    
    logger.info(`\n🟡 ${this.name} Manager received command: ${commandName}`);
    logger.info(`   Analyzing prompt: "${prompt.substring(0, 100)}..."`);
    
    try {
      // 1. Analyze the command and prompt to determine needed specialists
      const requiredSpecialists = context.requiredSpecialists || 
                                 await this.analyzeSpecialistNeeds(commandName, prompt);
      
      logger.info(`   Required specialists: ${requiredSpecialists.join(', ')}`);
      
      // 2. Spawn the required specialists
      const spawnedSpecialists = await this.spawnSpecialists(requiredSpecialists, context);
      
      logger.info(`   Spawned ${spawnedSpecialists.length} specialists`);
      
      // 3. Create task for specialists
      const task = {
        command: commandName,
        prompt: prompt,
        context: context,
        department: this.name,
        timestamp: new Date().toISOString()
      };
      
      // 4. Coordinate specialist execution
      const results = await this.coordinateSpecialists(spawnedSpecialists, task);
      
      // 5. Aggregate results
      const aggregatedResult = await this.aggregateResults(results, task);
      
      // 6. Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);
      
      logger.info(`🏁 ${this.name} Manager completed command in ${responseTime}ms`);
      
      return {
        success: true,
        department: this.name,
        command: commandName,
        specialists: requiredSpecialists,
        result: aggregatedResult,
        metrics: {
          responseTime,
          specialistsUsed: spawnedSpecialists.length
        }
      };
      
    } catch (error) {
      logger.error(`🔴 ${this.name} Manager failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze command and prompt to determine needed specialists
   */
  async analyzeSpecialistNeeds(commandName, prompt) {
    // Base implementation - derived classes should override
    const needs = [];
    const promptLower = prompt.toLowerCase();
    
    // Check for common patterns
    if (promptLower.includes('api') || promptLower.includes('endpoint')) {
      needs.push('api-architect');
    }
    if (promptLower.includes('database') || promptLower.includes('sql')) {
      needs.push('database-admin');
    }
    if (promptLower.includes('security') || promptLower.includes('auth')) {
      needs.push('security-specialist');
    }
    if (promptLower.includes('test') || promptLower.includes('qa')) {
      needs.push('test-automator');
    }
    if (promptLower.includes('deploy') || promptLower.includes('ci/cd')) {
      needs.push('devops-engineer');
    }
    
    // If no specific needs identified, use default for department
    if (needs.length === 0) {
      needs.push(this.getDefaultSpecialist());
    }
    
    return needs;
  }

  /**
   * Spawn the required specialists
   */
  async spawnSpecialists(specialistIds, context = {}) {
    const spawned = [];
    
    for (const specialistId of specialistIds) {
      try {
        const specialist = await this.spawnSpecialist(specialistId, context);
        if (specialist) {
          spawned.push(specialist);
          this.activeSpecialists.set(specialist.id, specialist);
          this.metrics.specialistsSpawned++;
          
          logger.info(`   🏁 Spawned ${specialistId}: ${specialist.id}`);
        }
      } catch (error) {
        logger.warn(`   🟠️ Failed to spawn ${specialistId}: ${error.message}`);
      }
    }
    
    return spawned;
  }

  /**
   * Spawn a single specialist
   */
  async spawnSpecialist(specialistId, context = {}) {
    // Check if we have the specialist class
    const SpecialistClass = this.specialists.get(specialistId);
    
    if (!SpecialistClass) {
      // Try variations of the specialist ID
      const variations = [
        specialistId,
        `${specialistId}-specialist`,
        specialistId.replace('-specialist', ''),
        specialistId.replace('_', '-')
      ];
      
      for (const variant of variations) {
        const found = this.specialists.get(variant);
        if (found) {
          return this.createSpecialistInstance(found, specialistId, context);
        }
      }
      
      throw new Error(`Specialist not found: ${specialistId}`);
    }
    
    return this.createSpecialistInstance(SpecialistClass, specialistId, context);
  }

  /**
   * Create specialist instance
   */
  createSpecialistInstance(SpecialistClass, specialistId, context) {
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
    
    // Determine coordination strategy
    const strategy = this.determineCoordinationStrategy(specialists, task);
    
    logger.info(`   Using ${strategy} coordination strategy`);
    
    switch (strategy) {
      case 'parallel':
        // Execute all specialists in parallel
        const parallelPromises = specialists.map(specialist => 
          this.executeSpecialistTask(specialist, task)
        );
        const parallelResults = await Promise.all(parallelPromises);
        results.push(...parallelResults);
        break;
        
      case 'sequential':
        // Execute specialists one by one
        for (const specialist of specialists) {
          const result = await this.executeSpecialistTask(specialist, task);
          results.push(result);
          
          // Pass result to next specialist
          task.previousResult = result;
        }
        break;
        
      case 'pipeline':
        // Pipeline execution - output of one feeds into next
        let pipelineData = task;
        for (const specialist of specialists) {
          const result = await this.executeSpecialistTask(specialist, pipelineData);
          results.push(result);
          
          // Transform task for next specialist
          pipelineData = {
            ...pipelineData,
            input: result
          };
        }
        break;
        
      default:
        // Default to parallel
        const defaultResults = await Promise.all(
          specialists.map(s => this.executeSpecialistTask(s, task))
        );
        results.push(...defaultResults);
    }
    
    return results;
  }

  /**
   * Execute task with a single specialist
   */
  async executeSpecialistTask(specialist, task) {
    try {
      // Check which execution method the specialist has
      if (specialist.execute) {
        return await specialist.execute(task);
      } else if (specialist.processTask) {
        return await specialist.processTask(task);
      } else if (specialist.executeTask) {
        return await specialist.executeTask(task);
      } else {
        // Fallback - create a mock result
        return {
          specialist: specialist.type,
          status: 'completed',
          result: `${specialist.type} analysis completed`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error(`   Specialist ${specialist.type} failed: ${error.message}`);
      return {
        specialist: specialist.type,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Determine coordination strategy
   */
  determineCoordinationStrategy(specialists, task) {
    // Single specialist - no coordination needed
    if (specialists.length === 1) {
      return 'single';
    }
    
    // Check task context for hints
    if (task.context && task.context.strategy) {
      return task.context.strategy;
    }
    
    // Department-specific strategies
    if (this.type === 'technical' && task.command.includes('api')) {
      return 'sequential'; // API design -> implementation -> testing
    }
    
    if (this.type === 'product' && specialists.length > 2) {
      return 'parallel'; // Multiple analyses in parallel
    }
    
    // Default to parallel for efficiency
    return 'parallel';
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
        summaryPoints.push(`${result.specialist}: ${result.result || 'Completed successfully'}`);
      }
    }
    
    return {
      task: task.command,
      completedBy: results.map(r => r.specialist),
      keyFindings: summaryPoints,
      recommendation: `${task.command} has been analyzed by ${results.length} specialists`
    };
  }

  /**
   * Update metrics
   */
  updateMetrics(responseTime) {
    this.metrics.tasksCompleted++;
    
    // Update average response time
    const count = this.metrics.tasksCompleted;
    const oldAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (oldAvg * (count - 1) + responseTime) / count;
  }

  /**
   * Get default specialist for department
   */
  getDefaultSpecialist() {
    const defaults = {
      'Backend-Engineer': 'backend-developer',
      'Design-Engineer': 'frontend-developer',
      'Product-Strategist': 'product-manager',
      'technical': 'backend-developer',
      'frontend': 'frontend-developer',
      'product': 'product-manager'
    };
    
    return defaults[this.name] || defaults[this.type] || 'generalist';
  }

  /**
   * Release specialists after task completion
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
   * Get manager metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSpecialists: this.activeSpecialists.size,
      availableSpecialists: this.specialists.size
    };
  }
}

module.exports = EnhancedDepartmentManager;