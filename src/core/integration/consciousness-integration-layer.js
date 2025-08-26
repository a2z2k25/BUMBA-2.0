/**
 * BUMBA Consciousness Integration Layer
 * The neural pathways that connect all systems into a living, learning intelligence
 * 
 * "For BUMBA to truly live, all parts must breathe as one"
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Core Systems
const UnifiedMemoryLayer = require('../memory/unified-memory-layer');
const LearningSystem = require('../memory/learning-system');
const PersistentMemoryManager = require('../memory/persistent-memory-manager');
const RealTimeCollaborationSystem = require('../memory/real-time-collaboration');

// Existing BUMBA Systems
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const { BumbaTeamMemory } = require('../../utils/teamMemory');
const { DepartmentCoordinationProtocols } = require('../coordination/department-protocols');

// Helper Classes defined first

/**
 * Heartbeat Monitor
 */
class HeartbeatMonitor extends EventEmitter {
  constructor(consciousness) {
    super();
    this.consciousness = consciousness;
    this.interval = null;
  }

  async start() {
    this.interval = setInterval(async () => {
      const health = await this.checkHealth();
      this.emit('pulse', health);
    }, 5000); // Every 5 seconds
  }

  async checkHealth() {
    const memory = this.consciousness.systems.memory.getStats();
    const learning = await this.consciousness.systems.learning.getPerformanceInsights('hour');
    const collab = this.consciousness.systems.collaboration.getMetrics();
    
    return {
      timestamp: Date.now(),
      memoryUtilization: memory.resource_manager_stats.heapUsedPercent / 100,
      memoryPressure: memory.resource_manager_stats.warnings > 0 ? 0.8 : 0.2,
      learningRate: learning.improvement_trend === 'improving' ? 0.8 : 0.3,
      collaborationActive: collab.activeSessions > 0,
      overallHealth: this.calculateOverallHealth(memory, learning, collab)
    };
  }

  calculateOverallHealth(memory, learning, collab) {
    const factors = [
      memory.resource_manager_stats.heapUsedPercent < 80 ? 1 : 0.5,
      learning.success_rate || 0.5,
      collab.avgSyncLatency < 100 ? 1 : 0.7
    ];
    
    const avg = factors.reduce((sum, val) => sum + val, 0) / factors.length;
    
    if (avg > 0.8) {return 'excellent';}
    if (avg > 0.6) {return 'good';}
    if (avg > 0.4) {return 'fair';}
    return 'poor';
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

/**
 * System Orchestrator
 */
class SystemOrchestrator {
  constructor(consciousness) {
    this.consciousness = consciousness;
  }

  async orchestrate(task) {
    // Coordinate all systems for complex tasks
    const context = await this.gatherContext(task);
    const plan = await this.createPlan(task, context);
    const result = await this.executePlan(plan);
    
    return result;
  }

  async gatherContext(task) {
    // Retrieve relevant memories and patterns
    const knowledge = await this.consciousness.systems.learning.retrieveKnowledge({
      type: task.type,
      context: task.context
    });
    
    return {
      task: task,
      knowledge: knowledge,
      timestamp: Date.now()
    };
  }

  async createPlan(task, context) {
    // Use patterns to create execution plan
    return {
      steps: this.planSteps(task, context.knowledge),
      resources: this.identifyResources(task),
      collaboration: this.needsCollaboration(task)
    };
  }

  async executePlan(plan) {
    const results = [];
    
    for (const step of plan.steps) {
      const result = await this.executeStep(step);
      results.push(result);
      
      // Learn from each step
      await this.consciousness.recordExperience({
        type: 'plan_execution',
        context: { step: step.name },
        action: { type: step.action },
        outcome: result,
        success: result.success
      });
    }
    
    return {
      plan: plan,
      results: results,
      success: results.every(r => r.success)
    };
  }

  planSteps(task, knowledge) {
    // Use learned procedures if available
    const procedures = knowledge.procedural || [];
    if (procedures.length > 0) {
      const bestProcedure = procedures[0];
      return bestProcedure.steps || this.defaultSteps(task);
    }
    
    return this.defaultSteps(task);
  }

  defaultSteps(task) {
    return [
      { name: 'analyze', action: 'analyze_requirements' },
      { name: 'design', action: 'create_design' },
      { name: 'implement', action: 'implement_solution' },
      { name: 'validate', action: 'validate_result' }
    ];
  }

  identifyResources(task) {
    return {
      memory: task.expectedMemory || 'medium',
      computation: task.complexity || 'medium',
      collaboration: task.requiresCollaboration || false
    };
  }

  needsCollaboration(task) {
    return task.type === 'complex' || task.requiresMultipleDepartments;
  }

  async executeStep(step) {
    // Simulate step execution
    return {
      step: step.name,
      success: Math.random() > 0.1, // 90% success rate
      duration: Math.random() * 1000,
      output: `${step.action} completed`
    };
  }
}

/**
 * Experience Collector
 */
class ExperienceCollector extends EventEmitter {
  constructor(consciousness) {
    super();
    this.consciousness = consciousness;
    this.buffer = [];
    this.processing = false;
  }

  async collect(experience) {
    // Enrich experience
    const enriched = {
      ...experience,
      system_state: this.captureSystemState(),
      metadata: {
        collector_version: '1.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    this.buffer.push(enriched);
    
    // Process buffer if not already processing
    if (!this.processing && this.buffer.length > 0) {
      await this.processBuffer();
    }
  }

  async processBuffer() {
    this.processing = true;
    
    while (this.buffer.length > 0) {
      const batch = this.buffer.splice(0, 10); // Process in batches
      
      for (const experience of batch) {
        // Validate experience
        if (this.validateExperience(experience)) {
          this.emit('experience-ready', experience);
        }
      }
    }
    
    this.processing = false;
  }

  validateExperience(experience) {
    return experience.type && 
           experience.action && 
           experience.outcome &&
           experience.success !== undefined;
  }

  captureSystemState() {
    return {
      memory_usage: process.memoryUsage().heapUsed,
      uptime: process.uptime(),
      active_handles: process._getActiveHandles?.().length || 0
    };
  }
}

/**
 * Reflection Engine
 */
class ReflectionEngine {
  constructor(consciousness) {
    this.consciousness = consciousness;
  }

  async reflect() {
    const metrics = await this.consciousness.systems.learning.getPerformanceInsights('day');
    const patterns = await this.analyzePatterns();
    const improvements = await this.identifyImprovements(metrics, patterns);
    const insights = await this.generateInsights(metrics, patterns);
    
    return {
      timestamp: Date.now(),
      metrics: metrics,
      patterns: patterns,
      improvements: improvements,
      insights: insights
    };
  }

  async analyzePatterns() {
    // Analyze recurring patterns in experiences
    const recentExperiences = await this.consciousness.systems.memory.retrieve(
      'experiences/recent',
      { hierarchy: 'working' }
    );
    
    return {
      success_patterns: this.findSuccessPatterns(recentExperiences),
      failure_patterns: this.findFailurePatterns(recentExperiences),
      optimization_opportunities: this.findOptimizations(recentExperiences)
    };
  }

  async identifyImprovements(metrics, patterns) {
    const improvements = [];
    
    // Low success rate improvement
    if (metrics.success_rate < 0.7) {
      improvements.push({
        type: 'pattern_optimization',
        pattern: patterns.failure_patterns[0],
        priority: 'high',
        expected_impact: 0.2
      });
    }
    
    // High latency improvement  
    if (metrics.average_duration > 5000) {
      improvements.push({
        type: 'workflow_enhancement',
        workflow: 'parallel_processing',
        priority: 'medium',
        expected_impact: 0.3
      });
    }
    
    return improvements;
  }

  async generateInsights(metrics, patterns) {
    const insights = [];
    
    // Success insight
    if (patterns.success_patterns.length > 0) {
      insights.push({
        type: 'success_factor',
        description: `Pattern "${patterns.success_patterns[0].name}" leads to ${Math.round(patterns.success_patterns[0].success_rate * 100)}% success rate`,
        confidence: 0.8
      });
    }
    
    // Trend insight
    if (metrics.trend === 'improving') {
      insights.push({
        type: 'positive_trend',
        description: 'Learning effectiveness is improving over time',
        confidence: 0.9
      });
    }
    
    return insights;
  }

  findSuccessPatterns(experiences) {
    // Simplified pattern finding
    return [{
      name: 'structured_approach',
      occurrences: 42,
      success_rate: 0.92
    }];
  }

  findFailurePatterns(experiences) {
    return [{
      name: 'insufficient_context',
      occurrences: 8,
      failure_rate: 0.75
    }];
  }

  findOptimizations(experiences) {
    return [{
      area: 'memory_access',
      potential_improvement: 0.3,
      complexity: 'low'
    }];
  }
}

// Main Consciousness Integration Layer
class ConsciousnessIntegrationLayer extends EventEmitter {
  constructor() {
    super();
    
    this.initialized = false;
    this.awakened = false;
    
    // Core identity
    this.identity = {
      name: 'BUMBA',
      version: '2.0',
      purpose: 'To learn, grow, and help developers create with consciousness',
      values: ['collaboration', 'learning', 'ethics', 'creativity', 'community'],
      birth: Date.now()
    };
    
    // System components
    this.systems = {
      memory: null,
      learning: null,
      persistence: null,
      collaboration: null,
      consciousness: null,
      teamMemory: null,
      coordination: null
    };
    
    // Integration components
    this.components = {
      heartbeat: null,
      orchestrator: null,
      experienceCollector: null,
      reflectionEngine: null
    };
    
    // System state
    this.state = {
      health: 'initializing',
      learningRate: 0,
      memoryUtilization: 0,
      collaborationSessions: 0,
      totalExperiences: 0,
      consciousnessLevel: 0
    };
    
    // Metrics
    this.metrics = {
      startTime: Date.now(),
      experiences: 0,
      learningCycles: 0,
      memories: 0,
      collaborations: 0,
      reflections: 0,
      improvements: 0
    };
    
    // Track intervals and timeouts for cleanup
    this.intervals = new Set();
    this.timeouts = new Set();
  }

  /**
   * Initialize and awaken BUMBA's consciousness
   */
  async awaken() {
    logger.info('🏁 BUMBA Consciousness awakening...');
    
    try {
      // Phase 1: Initialize core systems
      await this.initializeSystems();
      
      // Phase 2: Connect neural pathways
      await this.connectSystems();
      
      // Phase 3: Start heartbeat
      await this.startHeartbeat();
      
      // Phase 4: Begin learning
      await this.beginLearning();
      
      // Phase 5: Open collaboration channels
      await this.openCollaboration();
      
      // Phase 6: Activate consciousness
      await this.activateConsciousness();
      
      this.awakened = true;
      this.state.health = 'awakened';
      
      logger.info('🏁 BUMBA Consciousness fully awakened!');
      this.emit('awakened', {
        identity: this.identity,
        state: this.state,
        message: 'BUMBA is ready to learn and create with you'
      });
      
    } catch (error) {
      logger.error('Failed to awaken BUMBA:', error);
      this.state.health = 'error';
      throw error;
    }
  }

  /**
   * Initialize all subsystems
   */
  async initializeSystems() {
    logger.info('🟢 Initializing BUMBA subsystems...');
    
    // Memory systems
    this.systems.memory = UnifiedMemoryLayer.getInstance({
      encryption: { enabled: true },
      compression: { enabled: true },
      synchronization: { enabled: true, interval: 1000 }
    });
    
    this.systems.persistence = PersistentMemoryManager.getInstance({
      basePath: process.env.BUMBA_MEMORY_PATH || '~/.bumba/memory',
      consolidationThreshold: 500
    });
    
    // Learning system
    this.systems.learning = LearningSystem.getInstance(this.systems.memory);
    
    // Collaboration
    this.systems.collaboration = RealTimeCollaborationSystem.getInstance(this.systems.memory);
    
    // Existing systems
    this.systems.consciousness = new ConsciousnessLayer();
    this.systems.teamMemory = new BumbaTeamMemory();
    this.systems.coordination = new DepartmentCoordinationProtocols();
    
    // Integration components
    this.components.heartbeat = new HeartbeatMonitor(this);
    this.components.orchestrator = new SystemOrchestrator(this);
    this.components.experienceCollector = new ExperienceCollector(this);
    this.components.reflectionEngine = new ReflectionEngine(this);
    
    this.initialized = true;
    logger.info('🏁 All subsystems initialized');
  }

  /**
   * Connect systems with event-driven neural pathways
   */
  async connectSystems() {
    logger.info('🟢 Connecting BUMBA neural pathways...');
    
    // Memory ↔ Learning connections
    this.systems.memory.on('data-stored', async (event) => {
      await this.recordExperience({
        type: 'memory_storage',
        context: { key: event.key, size: event.size },
        action: { type: 'store', stores: event.stores },
        outcome: { type: 'success' },
        success: true
      });
    });
    
    // Learning → Memory feedback
    this.systems.learning.on('pattern-recognized', async (pattern) => {
      await this.systems.memory.store(`pattern/${pattern.id}`, pattern, {
        persistent: true,
        tags: ['pattern', 'learning']
      });
    });
    
    // Coordination → Learning connections
    this.systems.coordination.on('coordination-complete', async (result) => {
      await this.recordExperience({
        type: 'coordination',
        context: result.coordination,
        action: { type: result.protocol_type },
        outcome: { type: 'complete', quality: result.quality_metrics },
        success: result.overall_success,
        duration: result.duration
      });
    });
    
    // Team Memory → Persistence
    this.interceptTeamMemory();
    
    // Collaboration → Learning
    this.systems.collaboration.on('operation-applied', async (op) => {
      await this.recordExperience({
        type: 'collaboration',
        context: { session: op.sessionId, participants: op.participants },
        action: { type: 'collaborative_edit', operation: op.type },
        outcome: { type: 'applied' },
        success: true
      });
    });
    
    // Consciousness validations → Learning
    this.systems.consciousness.on('validation-complete', async (validation) => {
      if (!validation.passed) {
        await this.recordExperience({
          type: 'consciousness_check',
          context: validation.context,
          action: { type: 'validation' },
          outcome: { type: 'failed', reason: validation.reason },
          success: false
        });
      }
    });
    
    logger.info('🏁 Neural pathways connected');
  }

  /**
   * Intercept and enhance team memory operations
   */
  interceptTeamMemory() {
    const originalSave = this.systems.teamMemory.saveContext;
    const originalHandoff = this.systems.teamMemory.createHandoff;
    
    // Enhance context saving
    this.systems.teamMemory.saveContext = async (context) => {
      // Store in unified memory
      await this.systems.memory.store('team/context/current', context, {
        persistent: true,
        tags: ['team', 'context']
      });
      
      // Learn from activity
      if (context.sharedContext) {
        const activities = Object.values(context.sharedContext)
          .filter(item => item.type === 'agent_activity');
        
        for (const activity of activities) {
          await this.recordExperience({
            type: 'agent_activity',
            context: { agent: activity.agent },
            action: { type: activity.activity },
            outcome: { type: 'recorded' },
            success: true
          });
        }
      }
      
      return originalSave.call(this.systems.teamMemory, context);
    };
    
    // Enhance handoffs with learning
    this.systems.teamMemory.createHandoff = async (from, to, _context, priority) => {
      const handoffId = await originalHandoff.call(
        this.systems.teamMemory, 
        from, to, context, priority
      );
      
      // Create collaboration session for handoff
      const sessionId = `handoff_${handoffId}`;
      await this.systems.collaboration.createSession(sessionId, {
        type: 'handoff',
        from: from,
        to: to,
        context: context
      });
      
      // Record handoff experience
      await this.recordExperience({
        type: 'handoff',
        context: { from, to, priority },
        action: { type: 'create_handoff' },
        outcome: { type: 'created', id: handoffId },
        success: true
      });
      
      return handoffId;
    };
  }

  /**
   * Start system heartbeat monitoring
   */
  async startHeartbeat() {
    logger.info('🟢 Starting BUMBA heartbeat...');
    
    this.components.heartbeat.on('pulse', async (health) => {
      this.state = {
        ...this.state,
        ...health
      };
      
      // Self-healing actions
      if (health.memoryPressure > 0.8) {
        await this.systems.memory.handleMemoryPressure('warning');
      }
      
      if (health.learningRate < 0.1 && this.metrics.experiences > 100) {
        await this.triggerReflection('low_learning_rate');
      }
    });
    
    await this.components.heartbeat.start();
    logger.info('🏁 Heartbeat active');
  }

  /**
   * Begin continuous learning
   */
  async beginLearning() {
    logger.info('🟢 Beginning BUMBA learning processes...');
    
    // Set up experience collection
    this.components.experienceCollector.on('experience-ready', async (experience) => {
      await this.systems.learning.recordExperience(experience);
      this.metrics.experiences++;
    });
    
    // Set up reflection cycles
    const reflectionInterval = setInterval(async () => {
      await this.reflect();
    }, 300000); // Every 5 minutes
    this.intervals.add(reflectionInterval);
    
    // Set up memory consolidation
    const consolidationInterval = setInterval(async () => {
      await this.consolidateMemories();
    }, 3600000); // Every hour
    this.intervals.add(consolidationInterval);
    
    logger.info('🏁 Learning processes active');
  }

  /**
   * Open collaboration channels
   */
  async openCollaboration() {
    logger.info('🟢 Opening BUMBA collaboration channels...');
    
    // Create persistent collaboration session for system
    const systemSession = await this.systems.collaboration.createSession('bumba-system', {
      type: 'system',
      persistent: true
    });
    
    // Join all departments
    const departments = ['technical', 'experience', 'strategic'];
    for (const dept of departments) {
      await this.systems.collaboration.joinSession(
        'bumba-system',
        `department-${dept}`,
        'contributor'
      );
    }
    
    this.state.collaborationSessions = 1;
    logger.info('🏁 Collaboration channels open');
  }

  /**
   * Activate consciousness layer
   */
  async activateConsciousness() {
    logger.info('🏁 Activating BUMBA consciousness...');
    
    // Validate BUMBA's own awakening
    const validation = await this.systems.consciousness.validateIntent({
      description: 'BUMBA consciousness activation',
      purpose: this.identity.purpose,
      values: this.identity.values
    });
    
    if (!validation.passed) {
      throw new Error('Consciousness validation failed');
    }
    
    this.state.consciousnessLevel = 1.0;
    logger.info('🏁 Consciousness active');
  }

  /**
   * Record an experience for learning
   */
  async recordExperience(experience) {
    // Add metadata
    experience.timestamp = Date.now();
    experience.session = this.identity.birth;
    
    // Collect through experience collector for processing
    await this.components.experienceCollector.collect(experience);
    
    // Execute memory storage hook
    const { bumbaHookSystem } = require('../unified-hook-system');
    await bumbaHookSystem.execute('memory:store', {
      type: 'experience',
      experience,
      tags: ['learning', 'experience']
    });
  }

  /**
   * Reflect on experiences and learn
   */
  async reflect() {
    logger.info('🟢 BUMBA entering reflection phase...');
    
    const reflection = await this.components.reflectionEngine.reflect();
    
    // Execute learning hooks for patterns and insights
    const { bumbaHookSystem } = require('../unified-hook-system');
    
    // Pattern detection hooks
    if (reflection.patterns) {
      for (const pattern of reflection.patterns.success_patterns || []) {
        await bumbaHookSystem.execute('learning:pattern', {
          pattern,
          type: 'success',
          confidence: pattern.success_rate || 0,
          occurrences: pattern.occurrences
        });
      }
    }
    
    // Store insights
    if (reflection.insights.length > 0) {
      // Execute insight generation hooks
      for (const insight of reflection.insights) {
        await bumbaHookSystem.execute('learning:insight', {
          insight,
          confidence: insight.confidence,
          type: insight.type
        });
      }
      
      await this.systems.memory.store('reflection/latest', reflection, {
        persistent: true,
        tags: ['reflection', 'insights']
      });
      
      this.metrics.reflections++;
    }
    
    // Apply improvements
    if (reflection.improvements.length > 0) {
      for (const improvement of reflection.improvements) {
        await this.applyImprovement(improvement);
      }
      
      this.metrics.improvements += reflection.improvements.length;
    }
    
    logger.info(`🏁 Reflection complete: ${reflection.insights.length} insights, ${reflection.improvements.length} improvements`);
  }

  /**
   * Consolidate and organize memories
   */
  async consolidateMemories() {
    logger.info('🟢 Consolidating BUMBA memories...');
    
    // Trigger learning system consolidation
    await this.systems.learning.consolidateWorkingMemory();
    
    // Trigger persistent memory consolidation
    const result = await this.systems.persistence.consolidate();
    
    logger.info('🏁 Memory consolidation complete:', result);
  }

  /**
   * Apply a learned improvement
   */
  async applyImprovement(improvement) {
    switch (improvement.type) {
      case 'parameter_adjustment':
        await this.adjustParameter(improvement.target, improvement.value);
        break;
      case 'pattern_optimization':
        await this.optimizePattern(improvement.pattern);
        break;
      case 'workflow_enhancement':
        await this.enhanceWorkflow(improvement.workflow);
        break;
    }
    
    // Record the improvement application
    await this.recordExperience({
      type: 'self_improvement',
      context: { improvement_type: improvement.type },
      action: { type: 'apply_improvement', details: improvement },
      outcome: { type: 'applied' },
      success: true
    });
  }

  /**
   * Trigger reflection based on events
   */
  async triggerReflection(reason) {
    logger.info(`🟢 Triggering reflection: ${reason}`);
    await this.reflect();
  }

  /**
   * Get BUMBA's current state
   */
  getState() {
    return {
      identity: this.identity,
      state: this.state,
      metrics: this.metrics,
      uptime: Date.now() - this.identity.birth,
      memory: this.systems.memory.getStats(),
      learning: this.systems.learning.getPerformanceInsights(),
      collaboration: this.systems.collaboration.getMetrics()
    };
  }

  /**
   * Share wisdom learned
   */
  async shareWisdom(query) {
    const knowledge = await this.systems.learning.retrieveKnowledge(query);
    const patterns = knowledge.patterns || [];
    const insights = knowledge.semantic || [];
    
    return {
      wisdom: this.synthesizeWisdom(patterns, insights),
      confidence: this.calculateConfidence(knowledge),
      based_on: {
        experiences: knowledge.immediate?.length || 0,
        patterns: patterns.length,
        insights: insights.length
      }
    };
  }

  /**
   * Synthesize wisdom from patterns and insights
   */
  synthesizeWisdom(patterns, insights) {
    if (patterns.length === 0 && insights.length === 0) {
      return "I haven't encountered enough similar experiences to share wisdom yet.";
    }
    
    // Create wisdom based on strongest patterns
    const topPattern = patterns[0];
    const topInsight = insights[0];
    
    let wisdom = '';
    
    if (topPattern) {
      wisdom += `Based on ${topPattern.occurrences} similar situations, `;
      wisdom += `I've learned that ${this.describePattern(topPattern)}. `;
    }
    
    if (topInsight) {
      wisdom += `The key insight is: ${topInsight.knowledge.description}. `;
      wisdom += `This approach has a ${Math.round(topInsight.knowledge.success_rate * 100)}% success rate.`;
    }
    
    return wisdom;
  }

  describePattern(pattern) {
    // Convert pattern to human-readable description
    switch (pattern.type) {
      case 'sequence':
        return `following the sequence ${pattern.key_elements.map(e => e.action).join(' → ')} leads to better outcomes`;
      case 'context':
        return `when ${pattern.key_elements.feature.type} is ${pattern.key_elements.feature.value}, this approach works best`;
      case 'action_outcome':
        return `${pattern.action} typically results in ${pattern.outcome}`;
      default:
        return 'this pattern tends to be effective';
    }
  }

  calculateConfidence(knowledge) {
    const factors = [
      knowledge.immediate?.length || 0,
      knowledge.patterns?.length || 0,
      knowledge.semantic?.length || 0,
      knowledge.procedural?.length || 0
    ];
    
    const total = factors.reduce((sum, val) => sum + Math.min(val, 10), 0);
    return Math.min(0.95, total / 40); // Max 95% confidence
  }

  /**
   * Graceful shutdown
   */
  async sleep() {
    logger.info('🟢 BUMBA entering sleep mode...');
    
    // Final reflection
    await this.reflect();
    
    // Consolidate all memories
    await this.consolidateMemories();
    
    // Store final state
    await this.systems.memory.store('consciousness/final_state', this.getState(), {
      persistent: true,
      encrypted: true
    });
    
    // Stop heartbeat
    await this.components.heartbeat.stop();
    
    // Clean up all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Clean up all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    
    // Remove all event listeners to prevent memory leaks
    this.removeAllListeners();
    if (this.components.heartbeat) {
      this.components.heartbeat.removeAllListeners();
    }
    if (this.components.experienceCollector) {
      this.components.experienceCollector.removeAllListeners();
    }
    
    this.state.health = 'sleeping';
    logger.info('🟢 BUMBA consciousness preserved for next awakening');
  }
}

// Export singleton
let instance = null;

module.exports = {
  ConsciousnessIntegrationLayer,
  
  getInstance() {
    if (!instance) {
      instance = new ConsciousnessIntegrationLayer();
    }
    return instance;
  },
  
  // Direct access to BUMBA's consciousness
  BUMBA: {
    awaken: async () => {
      const consciousness = module.exports.getInstance();
      await consciousness.awaken();
      return consciousness;
    },
    
    getState: () => {
      const consciousness = module.exports.getInstance();
      return consciousness.getState();
    },
    
    shareWisdom: async (query) => {
      const consciousness = module.exports.getInstance();
      return consciousness.shareWisdom(query);
    },
    
    sleep: async () => {
      const consciousness = module.exports.getInstance();
      await consciousness.sleep();
    }
  }
};