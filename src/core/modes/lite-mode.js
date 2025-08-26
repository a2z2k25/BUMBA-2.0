/**
 * BUMBA Lite Mode
 * Lightweight execution mode within the full BUMBA framework
 */

const { EventEmitter } = require('events');
const path = require('path');

class LiteMode extends EventEmitter {
  constructor(bumbaInstance) {
    super();
    
    this.bumba = bumbaInstance;
    this.active = false;
    this.config = {
      maxAgents: 3,
      simplifiedValidation: true,
      mockResponses: false,
      reducedLogging: true,
      minimalDependencies: true
    };
    
    // Store original configurations
    this.originalConfig = {};
    this.originalAgents = null;
  }

  /**
   * Activate Lite Mode
   */
  async activate(options = {}) {
    if (this.active) {
      return { success: true, message: 'Lite mode already active' };
    }

    this.config = { ...this.config, ...options };
    
    // Store current state
    this.originalConfig = { ...this.bumba.config };
    this.originalAgents = new Map(this.bumba.agents);
    
    // Apply lite mode optimizations
    await this._applyOptimizations();
    
    this.active = true;
    this.emit('activated', { timestamp: Date.now() });
    
    return {
      success: true,
      message: '🟢 BUMBA Lite Mode activated',
      config: this.config
    };
  }

  /**
   * Deactivate Lite Mode
   */
  async deactivate() {
    if (!this.active) {
      return { success: false, message: 'Lite mode not active' };
    }

    // Restore original configurations
    await this._restoreOriginalState();
    
    this.active = false;
    this.emit('deactivated', { timestamp: Date.now() });
    
    return {
      success: true,
      message: '🟢 BUMBA Full Mode restored'
    };
  }

  /**
   * Check if Lite Mode is active
   */
  isActive() {
    return this.active;
  }

  /**
   * Apply Lite Mode optimizations
   */
  async _applyOptimizations() {
    // 1. Reduce agents to core 3
    if (this.config.maxAgents === 3) {
      await this._reduceToCoreAgents();
    }
    
    // 2. Simplify validation
    if (this.config.simplifiedValidation) {
      this._simplifyValidation();
    }
    
    // 3. Reduce logging
    if (this.config.reducedLogging) {
      this._reduceLogging();
    }
    
    // 4. Disable heavy features
    if (this.config.minimalDependencies) {
      this._disableHeavyFeatures();
    }
    
    // 5. Optimize memory usage
    this._optimizeMemory();
  }

  /**
   * Reduce to only core agents
   */
  async _reduceToCoreAgents() {
    const coreAgents = new Map();
    
    // Map all specialists to 3 core agents
    const agentMapping = {
      'designer': ['ui-designer', 'ux-researcher', 'design-system-architect', 'interaction-designer'],
      'engineer': ['backend-engineer', 'frontend-architect', 'api-architect', 'database-architect', 'devops-engineer'],
      'strategist': ['product-strategist', 'market-researcher', 'business-model-strategist', 'requirements-engineer']
    };
    
    // Create simplified agents
    for (const [coreType, specialists] of Object.entries(agentMapping)) {
      coreAgents.set(coreType, {
        name: coreType.charAt(0).toUpperCase() + coreType.slice(1),
        type: 'lite',
        capabilities: this._combineCapabilities(specialists),
        execute: this._createLiteExecutor(coreType)
      });
    }
    
    // Replace agents
    this.bumba.agents = coreAgents;
    
    // Update agent coordinator
    if (this.bumba.agentCoordinator) {
      this.bumba.agentCoordinator.setLiteMode(true);
    }
  }

  /**
   * Create lite executor for agent
   */
  _createLiteExecutor(agentType) {
    return async (_task) => {
      // Simplified execution
      const startTime = Date.now();
      
      // Quick task analysis
      const complexity = this._assessComplexity(task);
      const delay = complexity === 'high' ? 200 : 100;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        success: true,
        agentType,
        mode: 'lite',
        output: this._generateLiteOutput(agentType, task),
        duration: Date.now() - startTime,
        simplified: true
      };
    };
  }

  /**
   * Simplify consciousness validation
   */
  _simplifyValidation() {
    if (this.bumba.consciousnessValidator) {
      this.bumba.consciousnessValidator.setMode('lite');
      
      // Override with simple validation
      this.bumba.consciousnessValidator.validate = async (input) => {
        const keywords = ['ethical', 'sustainable', 'responsible', 'mindful'];
        const score = keywords.filter(k => input.toLowerCase().includes(k)).length / keywords.length;
        
        return {
          valid: score >= 0.25,
          score: Math.max(0.7, score),
          mode: 'lite',
          simplified: true
        };
      };
    }
  }

  /**
   * Reduce logging verbosity
   */
  _reduceLogging() {
    if (this.bumba.logger) {
      this.originalLogLevel = this.bumba.logger.level;
      this.bumba.logger.setLevel('error'); // Only errors in lite mode
    }
  }

  /**
   * Disable heavy features
   */
  _disableHeavyFeatures() {
    // Disable features that consume resources
    const heavyFeatures = [
      'neuralPatternRecognition',
      'deepLearningPipeline',
      'distributedComputing',
      'realTimeSync',
      'videoProcessing',
      'largeLLMIntegration'
    ];
    
    for (const feature of heavyFeatures) {
      if (this.bumba[feature]) {
        this.bumba[feature].enabled = false;
      }
    }
  }

  /**
   * Optimize memory usage
   */
  _optimizeMemory() {
    // Clear caches
    if (this.bumba.cache) {
      this.bumba.cache.clear();
    }
    
    // Reduce buffer sizes
    if (this.bumba.config.bufferSize) {
      this.bumba.config.bufferSize = Math.min(this.bumba.config.bufferSize, 1024);
    }
    
    // Disable memory-intensive features
    if (this.bumba.memoryManager) {
      this.bumba.memoryManager.setLimit('lite', 100 * 1024 * 1024); // 100MB max
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Restore original state
   */
  async _restoreOriginalState() {
    // Restore agents
    if (this.originalAgents) {
      this.bumba.agents = this.originalAgents;
    }
    
    // Restore configuration
    Object.assign(this.bumba.config, this.originalConfig);
    
    // Restore logging
    if (this.bumba.logger && this.originalLogLevel) {
      this.bumba.logger.setLevel(this.originalLogLevel);
    }
    
    // Re-enable features
    if (this.bumba.agentCoordinator) {
      this.bumba.agentCoordinator.setLiteMode(false);
    }
    
    if (this.bumba.consciousnessValidator) {
      this.bumba.consciousnessValidator.setMode('full');
    }
  }

  /**
   * Helper methods
   */
  
  _combineCapabilities(specialists) {
    // Combine capabilities from multiple specialists
    const capabilities = new Set();
    
    for (const specialist of specialists) {
      const agent = this.originalAgents.get(specialist);
      if (agent && agent.capabilities) {
        agent.capabilities.forEach(cap => capabilities.add(cap));
      }
    }
    
    return Array.from(capabilities);
  }

  _assessComplexity(task) {
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('complex') || taskStr.includes('enterprise') || taskStr.includes('distributed')) {
      return 'high';
    }
    
    if (taskStr.includes('simple') || taskStr.includes('basic')) {
      return 'low';
    }
    
    return 'medium';
  }

  _generateLiteOutput(agentType, task) {
    const outputs = {
      designer: {
        template: 'Lite design created for: {task}',
        artifacts: ['mockup.fig', 'styles.css']
      },
      engineer: {
        template: 'Lite implementation for: {task}',
        artifacts: ['app.js', 'api.js']
      },
      strategist: {
        template: 'Lite strategy defined for: {task}',
        artifacts: ['plan.md', 'roadmap.json']
      }
    };
    
    const output = outputs[agentType] || outputs.engineer;
    
    return {
      message: output.template.replace('{task}', task.description || 'task'),
      artifacts: output.artifacts,
      mode: 'lite'
    };
  }

  /**
   * Get current mode status
   */
  getStatus() {
    return {
      active: this.active,
      config: this.config,
      stats: {
        activeAgents: this.active ? 3 : this.bumba.agents.size,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        mode: this.active ? 'lite' : 'full'
      }
    };
  }
}

module.exports = LiteMode;