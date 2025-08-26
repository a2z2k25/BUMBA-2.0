/**
 * BUMBA Smart Handoff Manager
 * Intelligent agent transition system with automatic detection
 * Ensures smooth context transfer and optimal agent selection
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedMemorySystem } = require('../memory/unified-memory-system');
const { AgentCommunicationProtocol } = require('../communication/agent-communication-protocol');
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Smart Handoff Manager for intelligent agent transitions
 */
class SmartHandoffManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      handoffThreshold: config.handoffThreshold || 0.7,
      performanceWindow: config.performanceWindow || 300000, // 5 minutes
      maxRetries: config.maxRetries || 3,
      contextCompressionLevel: config.contextCompressionLevel || 'medium',
      enableAutoHandoff: config.enableAutoHandoff !== false,
      handoffHistoryPath: config.handoffHistoryPath || path.join(process.env.HOME, '.claude', 'handoffs'),
      ...config
    };
    
    // Active agents tracking
    this.activeAgents = new Map();
    
    // Agent performance metrics
    this.agentMetrics = new Map();
    
    // Handoff queue
    this.handoffQueue = [];
    
    // Active handoffs
    this.activeHandoffs = new Map();
    
    // Handoff history
    this.handoffHistory = [];
    
    // Agent expertise registry
    this.agentExpertise = new Map([
      ['product-strategist', {
        strengths: ['requirements', 'planning', 'roadmap', 'business'],
        weaknesses: ['low-level-code', 'infrastructure'],
        preferredTasks: ['strategy', 'analysis', 'documentation']
      }],
      ['design-engineer', {
        strengths: ['ui', 'ux', 'frontend', 'visual', 'accessibility'],
        weaknesses: ['backend', 'database', 'infrastructure'],
        preferredTasks: ['component', 'styling', 'interaction']
      }],
      ['backend-engineer', {
        strengths: ['api', 'database', 'performance', 'security', 'infrastructure'],
        weaknesses: ['ui', 'visual-design'],
        preferredTasks: ['optimization', 'integration', 'architecture']
      }]
    ]);
    
    // Handoff triggers
    this.handoffTriggers = {
      performance: {
        errorRate: 0.3,
        responseTime: 10000,
        retryCount: 3
      },
      expertise: {
        mismatchThreshold: 0.6,
        complexityThreshold: 0.8
      },
      resource: {
        memoryUsage: 0.9,
        cpuUsage: 0.8,
        timeLimit: 600000 // 10 minutes
      },
      explicit: {
        userRequest: true,
        agentRequest: true,
        systemOverride: true
      }
    };
    
    // Integration points
    this.memory = null;
    this.communication = null;
    this.consciousness = new ConsciousnessLayer();
    
    // Metrics
    this.metrics = {
      totalHandoffs: 0,
      successfulHandoffs: 0,
      failedHandoffs: 0,
      averageTransferTime: 0,
      contextLossRate: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the handoff manager
   */
  async initialize() {
    try {
      // Create storage directory
      await fs.mkdir(this.config.handoffHistoryPath, { recursive: true });
      
      // Load handoff history
      await this.loadHandoffHistory();
      
      // Connect to subsystems
      this.memory = UnifiedMemorySystem.getInstance();
      this.communication = AgentCommunicationProtocol.getInstance();
      
      // Set up monitoring
      this.startMonitoring();
      
      logger.info('🏁 Smart Handoff Manager initialized');
      
      this.emit('initialized', {
        agentsRegistered: this.agentExpertise.size,
        historyLoaded: this.handoffHistory.length
      });
      
    } catch (error) {
      logger.error('Failed to initialize Smart Handoff Manager:', error);
    }
  }
  
  /**
   * Detect when a handoff is needed
   */
  async detectHandoffNeed(agentMetrics) {
    try {
      const triggers = [];
      const agentId = agentMetrics.agentId;
      
      // Check performance triggers
      if (this.checkPerformanceTriggers(agentMetrics)) {
        triggers.push({
          type: 'performance',
          reason: 'Agent performance below threshold',
          severity: 'high'
        });
      }
      
      // Check expertise mismatch
      const expertiseMismatch = await this.checkExpertiseMismatch(agentMetrics);
      if (expertiseMismatch) {
        triggers.push({
          type: 'expertise',
          reason: expertiseMismatch.reason,
          severity: expertiseMismatch.severity
        });
      }
      
      // Check resource constraints
      if (this.checkResourceConstraints(agentMetrics)) {
        triggers.push({
          type: 'resource',
          reason: 'Resource limits exceeded',
          severity: 'medium'
        });
      }
      
      // Check task complexity
      const complexityIssue = await this.checkTaskComplexity(agentMetrics);
      if (complexityIssue) {
        triggers.push({
          type: 'complexity',
          reason: complexityIssue.reason,
          severity: complexityIssue.severity
        });
      }
      
      // Check for stuck state
      if (this.checkStuckState(agentMetrics)) {
        triggers.push({
          type: 'stuck',
          reason: 'Agent appears stuck or looping',
          severity: 'high'
        });
      }
      
      // Evaluate triggers
      if (triggers.length > 0) {
        const handoffScore = this.calculateHandoffScore(triggers);
        
        if (handoffScore >= this.config.handoffThreshold) {
          logger.warn(`🟢 Handoff needed for agent ${agentId}:`, triggers);
          
          this.emit('handoff-needed', {
            agentId,
            triggers,
            score: handoffScore,
            timestamp: new Date()
          });
          
          // Auto-initiate if enabled
          if (this.config.enableAutoHandoff) {
            await this.initiateHandoff(agentId, triggers);
          }
          
          return {
            needed: true,
            triggers,
            score: handoffScore
          };
        }
      }
      
      return {
        needed: false,
        triggers: [],
        score: 0
      };
      
    } catch (error) {
      logger.error('Failed to detect handoff need:', error);
      return { needed: false, error: error.message };
    }
  }
  
  /**
   * Select the best agent for a task
   */
  async selectBestAgent(task, availableAgents) {
    try {
      const scoredAgents = [];
      
      for (const agent of availableAgents) {
        const score = await this.scoreAgentForTask(agent, task);
        scoredAgents.push({
          agent,
          score,
          factors: this.getScoreFactors(agent, task)
        });
      }
      
      // Sort by score
      scoredAgents.sort((a, b) => b.score - a.score);
      
      // Get top candidate
      const selected = scoredAgents[0];
      
      if (!selected || selected.score < 0.3) {
        logger.warn('No suitable agent found for task');
        return null;
      }
      
      logger.info(`🏁 Selected agent ${selected.agent.id} for task (score: ${selected.score})`);
      
      this.emit('agent-selected', {
        task,
        selectedAgent: selected.agent,
        score: selected.score,
        alternatives: scoredAgents.slice(1, 3)
      });
      
      return selected.agent;
      
    } catch (error) {
      logger.error('Failed to select best agent:', error);
      return availableAgents[0]; // Fallback to first available
    }
  }
  
  /**
   * Transfer context from one agent to another
   */
  async transferContext(fromAgent, toAgent) {
    try {
      const handoffId = `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info(`🟢 Initiating context transfer: ${fromAgent} → ${toAgent}`);
      
      // Create handoff record
      const handoff = {
        id: handoffId,
        fromAgent,
        toAgent,
        startTime: new Date(),
        status: 'in-progress',
        context: null,
        metrics: {}
      };
      
      this.activeHandoffs.set(handoffId, handoff);
      
      // Step 1: Extract context from source agent
      const context = await this.extractAgentContext(fromAgent);
      
      if (!context) {
        throw new Error('Failed to extract context from source agent');
      }
      
      // Step 2: Compress and optimize context
      const optimizedContext = await this.optimizeContext(context, toAgent);
      
      // Step 3: Validate context integrity
      const validation = await this.validateContext(optimizedContext);
      
      if (!validation.valid) {
        throw new Error(`Context validation failed: ${validation.reason}`);
      }
      
      // Step 4: Transfer context to target agent
      const transferResult = await this.injectContext(toAgent, optimizedContext);
      
      // Step 5: Verify transfer success
      const verification = await this.verifyTransfer(toAgent, optimizedContext);
      
      // Update handoff record
      handoff.endTime = new Date();
      handoff.status = verification.success ? 'completed' : 'failed';
      handoff.context = optimizedContext;
      handoff.metrics = {
        contextSize: JSON.stringify(optimizedContext).length,
        transferTime: handoff.endTime - handoff.startTime,
        compressionRatio: context.size / optimizedContext.size,
        integrityScore: validation.score
      };
      
      // Store in history
      this.handoffHistory.push(handoff);
      await this.saveHandoffHistory();
      
      // Update metrics
      this.updateMetrics(handoff);
      
      // Clean up source agent
      if (verification.success) {
        await this.cleanupSourceAgent(fromAgent);
      }
      
      this.emit('context-transferred', {
        handoffId,
        fromAgent,
        toAgent,
        success: verification.success,
        metrics: handoff.metrics
      });
      
      logger.info(`🏁 Context transfer completed: ${fromAgent} → ${toAgent}`);
      
      return {
        success: verification.success,
        handoffId,
        metrics: handoff.metrics
      };
      
    } catch (error) {
      logger.error('Context transfer failed:', error);
      
      this.metrics.failedHandoffs++;
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Initiate automatic handoff
   */
  async initiateHandoff(agentId, triggers) {
    try {
      // Get current agent state
      const agentState = await this.getAgentState(agentId);
      
      // Find suitable replacement
      const availableAgents = await this.getAvailableAgents(agentState.task);
      const replacement = await this.selectBestAgent(agentState.task, availableAgents);
      
      if (!replacement) {
        logger.error('No replacement agent available for handoff');
        return null;
      }
      
      // Queue handoff
      const handoffRequest = {
        id: `req-${Date.now()}`,
        fromAgent: agentId,
        toAgent: replacement.id,
        triggers,
        priority: this.calculatePriority(triggers),
        status: 'queued',
        timestamp: new Date()
      };
      
      this.handoffQueue.push(handoffRequest);
      
      // Process queue
      await this.processHandoffQueue();
      
      return handoffRequest;
      
    } catch (error) {
      logger.error('Failed to initiate handoff:', error);
      return null;
    }
  }
  
  /**
   * Process handoff queue
   */
  async processHandoffQueue() {
    while (this.handoffQueue.length > 0) {
      // Sort by priority
      this.handoffQueue.sort((a, b) => b.priority - a.priority);
      
      const request = this.handoffQueue.shift();
      
      try {
        request.status = 'processing';
        
        // Execute handoff
        const result = await this.transferContext(request.fromAgent, request.toAgent);
        
        request.status = result.success ? 'completed' : 'failed';
        request.result = result;
        
      } catch (error) {
        request.status = 'failed';
        request.error = error.message;
        logger.error(`Handoff ${request.id} failed:`, error);
      }
    }
  }
  
  // Helper methods
  
  checkPerformanceTriggers(metrics) {
    const triggers = this.handoffTriggers.performance;
    
    return (
      metrics.errorRate > triggers.errorRate ||
      metrics.responseTime > triggers.responseTime ||
      metrics.retryCount >= triggers.retryCount
    );
  }
  
  async checkExpertiseMismatch(metrics) {
    const agentExpertise = this.agentExpertise.get(metrics.agentType);
    
    if (!agentExpertise) {return null;}
    
    const taskType = metrics.currentTask?.type;
    
    if (taskType && agentExpertise.weaknesses.includes(taskType)) {
      return {
        reason: `Task type '${taskType}' is a weakness for ${metrics.agentType}`,
        severity: 'high'
      };
    }
    
    if (taskType && !agentExpertise.strengths.includes(taskType)) {
      const mismatchScore = this.calculateMismatchScore(taskType, agentExpertise);
      
      if (mismatchScore > this.handoffTriggers.expertise.mismatchThreshold) {
        return {
          reason: `Task type '${taskType}' not optimal for ${metrics.agentType}`,
          severity: 'medium'
        };
      }
    }
    
    return null;
  }
  
  checkResourceConstraints(metrics) {
    const triggers = this.handoffTriggers.resource;
    
    return (
      metrics.memoryUsage > triggers.memoryUsage ||
      metrics.cpuUsage > triggers.cpuUsage ||
      (metrics.taskDuration && metrics.taskDuration > triggers.timeLimit)
    );
  }
  
  async checkTaskComplexity(metrics) {
    if (!metrics.currentTask) {return null;}
    
    const complexity = await this.calculateTaskComplexity(metrics.currentTask);
    
    if (complexity > this.handoffTriggers.expertise.complexityThreshold) {
      return {
        reason: `Task complexity (${complexity}) exceeds agent capability`,
        severity: complexity > 0.9 ? 'high' : 'medium'
      };
    }
    
    return null;
  }
  
  checkStuckState(metrics) {
    // Check for repetitive actions
    if (metrics.repeatActions && metrics.repeatActions > 5) {
      return true;
    }
    
    // Check for no progress
    if (metrics.progressRate && metrics.progressRate < 0.1) {
      return true;
    }
    
    // Check for timeout
    if (metrics.lastProgress) {
      const timeSinceProgress = Date.now() - metrics.lastProgress;
      if (timeSinceProgress > 300000) { // 5 minutes
        return true;
      }
    }
    
    return false;
  }
  
  calculateHandoffScore(triggers) {
    let score = 0;
    const weights = {
      performance: 0.3,
      expertise: 0.25,
      resource: 0.2,
      complexity: 0.15,
      stuck: 0.1
    };
    
    triggers.forEach(trigger => {
      const weight = weights[trigger.type] || 0.1;
      const severityMultiplier = trigger.severity === 'high' ? 1.0 : 
                                trigger.severity === 'medium' ? 0.7 : 0.4;
      score += weight * severityMultiplier;
    });
    
    return Math.min(score, 1.0);
  }
  
  async scoreAgentForTask(agent, task) {
    let score = 0;
    
    // Expertise match
    const expertise = this.agentExpertise.get(agent.type);
    if (expertise) {
      if (expertise.preferredTasks.includes(task.type)) {
        score += 0.4;
      }
      if (expertise.strengths.includes(task.category)) {
        score += 0.3;
      }
      if (expertise.weaknesses.includes(task.category)) {
        score -= 0.5;
      }
    }
    
    // Availability
    const agentMetrics = this.agentMetrics.get(agent.id);
    if (agentMetrics) {
      if (!agentMetrics.busy) {score += 0.2;}
      if (agentMetrics.successRate > 0.8) {score += 0.1;}
    } else {
      score += 0.3; // Fresh agent bonus
    }
    
    // Recent performance
    const recentHandoffs = this.getRecentHandoffs(agent.id);
    const successRate = this.calculateSuccessRate(recentHandoffs);
    score += successRate * 0.2;
    
    // Consciousness alignment
    if (this.consciousness) {
      const alignment = await this.consciousness.validate({
        type: 'agent_selection',
        agent: agent.id,
        task: task.type
      });
      score += alignment.score * 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  getScoreFactors(agent, task) {
    const expertise = this.agentExpertise.get(agent.type);
    
    return {
      expertiseMatch: expertise && expertise.preferredTasks.includes(task.type),
      availability: !this.agentMetrics.get(agent.id)?.busy,
      performance: this.agentMetrics.get(agent.id)?.successRate || 1.0,
      specialization: expertise?.strengths.includes(task.category)
    };
  }
  
  async extractAgentContext(agentId) {
    const context = {
      agentId,
      timestamp: new Date(),
      task: null,
      state: {},
      memory: {},
      history: [],
      metadata: {}
    };
    
    // Get from active agents
    const agentInfo = this.activeAgents.get(agentId);
    if (agentInfo) {
      context.task = agentInfo.currentTask;
      context.state = agentInfo.state;
      context.history = agentInfo.history || [];
    }
    
    // Get from memory system
    if (this.memory) {
      const memoryContext = await this.memory.retrieveAgentContext(agentId);
      context.memory = memoryContext;
    }
    
    // Get recent decisions and actions
    const recentActions = await this.getRecentAgentActions(agentId);
    context.history.push(...recentActions);
    
    // Calculate size
    context.size = JSON.stringify(context).length;
    
    return context;
  }
  
  async optimizeContext(context, targetAgent) {
    const optimized = { ...context };
    
    // Compress based on configuration
    if (this.config.contextCompressionLevel === 'high') {
      // Keep only essential information
      optimized.history = context.history.slice(-5); // Last 5 actions
      optimized.memory = this.extractKeyMemories(context.memory);
      delete optimized.metadata;
    } else if (this.config.contextCompressionLevel === 'medium') {
      // Moderate compression
      optimized.history = context.history.slice(-10);
      optimized.memory = this.compressMemory(context.memory);
    }
    
    // Add target agent specifics
    optimized.targetAgent = targetAgent;
    optimized.transferTimestamp = new Date();
    
    // Calculate compressed size
    optimized.size = JSON.stringify(optimized).length;
    
    return optimized;
  }
  
  extractKeyMemories(memory) {
    // Extract only high-importance memories
    if (!memory || typeof memory !== 'object') {return {};}
    
    const key = {};
    for (const [k, v] of Object.entries(memory)) {
      if (v.importance && v.importance > 0.7) {
        key[k] = v;
      }
    }
    return key;
  }
  
  compressMemory(memory) {
    // Moderate compression - keep structure but reduce detail
    if (!memory || typeof memory !== 'object') {return {};}
    
    const compressed = {};
    for (const [k, v] of Object.entries(memory)) {
      if (v.importance && v.importance > 0.5) {
        compressed[k] = {
          data: v.data,
          importance: v.importance,
          timestamp: v.timestamp
        };
      }
    }
    return compressed;
  }
  
  async validateContext(context) {
    const validation = {
      valid: true,
      score: 1.0,
      issues: []
    };
    
    // Check required fields
    if (!context.agentId || !context.task) {
      validation.valid = false;
      validation.issues.push('Missing required fields');
      validation.score -= 0.5;
    }
    
    // Check context size
    if (context.size > 1000000) { // 1MB limit
      validation.valid = false;
      validation.issues.push('Context too large');
      validation.score -= 0.3;
    }
    
    // Validate with consciousness
    if (this.consciousness) {
      const consciousnessCheck = await this.consciousness.validate({
        type: 'context_transfer',
        data: context
      });
      
      if (consciousnessCheck.score < 0.5) {
        validation.valid = false;
        validation.issues.push('Failed consciousness validation');
      }
      
      validation.score *= consciousnessCheck.score;
    }
    
    validation.reason = validation.issues.join(', ');
    
    return validation;
  }
  
  async injectContext(agentId, context) {
    try {
      // Update active agents registry
      this.activeAgents.set(agentId, {
        currentTask: context.task,
        state: context.state,
        history: context.history,
        startTime: new Date(),
        fromHandoff: true
      });
      
      // Update memory system
      if (this.memory) {
        await this.memory.storeAgentContext(agentId, context.memory);
      }
      
      // Send via communication protocol
      if (this.communication) {
        await this.communication.sendMessage({
          type: 'context_injection',
          to: agentId,
          data: context,
          priority: 'high'
        });
      }
      
      return { success: true };
      
    } catch (error) {
      logger.error(`Failed to inject context to ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async verifyTransfer(agentId, expectedContext) {
    try {
      // Get current agent context
      const currentContext = await this.extractAgentContext(agentId);
      
      // Compare key elements
      const verification = {
        success: true,
        checks: []
      };
      
      // Check task transfer
      if (currentContext.task?.id === expectedContext.task?.id) {
        verification.checks.push({ item: 'task', passed: true });
      } else {
        verification.success = false;
        verification.checks.push({ item: 'task', passed: false });
      }
      
      // Check state transfer
      const stateMatch = JSON.stringify(currentContext.state) === JSON.stringify(expectedContext.state);
      verification.checks.push({ item: 'state', passed: stateMatch });
      if (!stateMatch) {verification.success = false;}
      
      // Check memory transfer (at least 80% transferred)
      const memoryKeys = Object.keys(expectedContext.memory || {});
      const transferredKeys = Object.keys(currentContext.memory || {});
      const memoryTransferRate = transferredKeys.length / (memoryKeys.length || 1);
      
      verification.checks.push({ 
        item: 'memory', 
        passed: memoryTransferRate >= 0.8,
        rate: memoryTransferRate
      });
      
      if (memoryTransferRate < 0.8) {verification.success = false;}
      
      return verification;
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async cleanupSourceAgent(agentId) {
    try {
      // Remove from active agents
      this.activeAgents.delete(agentId);
      
      // Clear agent-specific memory
      if (this.memory) {
        await this.memory.clearAgentContext(agentId);
      }
      
      // Reset agent metrics
      this.agentMetrics.delete(agentId);
      
      logger.info(`🟢 Cleaned up source agent: ${agentId}`);
      
    } catch (error) {
      logger.error(`Failed to cleanup agent ${agentId}:`, error);
    }
  }
  
  async getAgentState(agentId) {
    const agent = this.activeAgents.get(agentId);
    
    if (!agent) {
      return {
        task: { type: 'unknown', id: 'unknown' },
        state: {},
        metrics: {}
      };
    }
    
    return {
      task: agent.currentTask,
      state: agent.state,
      metrics: this.agentMetrics.get(agentId) || {}
    };
  }
  
  async getAvailableAgents(task) {
    const available = [];
    
    // Get all registered agents
    for (const [agentType, expertise] of this.agentExpertise.entries()) {
      // Check if agent type is suitable
      if (!expertise.weaknesses.includes(task.type)) {
        available.push({
          id: `${agentType}-${Date.now()}`,
          type: agentType,
          expertise
        });
      }
    }
    
    return available;
  }
  
  calculatePriority(triggers) {
    let priority = 0;
    
    triggers.forEach(trigger => {
      if (trigger.severity === 'high') {priority += 3;}
      else if (trigger.severity === 'medium') {priority += 2;}
      else {priority += 1;}
    });
    
    return priority;
  }
  
  calculateMismatchScore(taskType, expertise) {
    // Check how far the task is from agent's expertise
    let score = 0.5; // Neutral starting point
    
    if (expertise.strengths.some(s => taskType.includes(s))) {
      score -= 0.3;
    }
    
    if (expertise.weaknesses.some(w => taskType.includes(w))) {
      score += 0.4;
    }
    
    return score;
  }
  
  async calculateTaskComplexity(task) {
    let complexity = 0.3; // Base complexity
    
    // Factor in task attributes
    if (task.dependencies && task.dependencies.length > 3) {
      complexity += 0.2;
    }
    
    if (task.estimatedTime && task.estimatedTime > 3600000) { // > 1 hour
      complexity += 0.1;
    }
    
    if (task.requiresExpertise && task.requiresExpertise.length > 2) {
      complexity += 0.2;
    }
    
    if (task.priority === 'critical') {
      complexity += 0.2;
    }
    
    return Math.min(complexity, 1.0);
  }
  
  getRecentHandoffs(agentId) {
    const cutoff = Date.now() - this.config.performanceWindow;
    
    return this.handoffHistory.filter(h => 
      (h.fromAgent === agentId || h.toAgent === agentId) &&
      new Date(h.startTime).getTime() > cutoff
    );
  }
  
  calculateSuccessRate(handoffs) {
    if (handoffs.length === 0) {return 1.0;}
    
    const successful = handoffs.filter(h => h.status === 'completed').length;
    return successful / handoffs.length;
  }
  
  async getRecentAgentActions(agentId) {
    // Get from memory system
    if (this.memory) {
      const actions = await this.memory.getAgentHistory(agentId, 20);
      return actions || [];
    }
    
    return [];
  }
  
  updateMetrics(handoff) {
    this.metrics.totalHandoffs++;
    
    if (handoff.status === 'completed') {
      this.metrics.successfulHandoffs++;
    } else {
      this.metrics.failedHandoffs++;
    }
    
    // Update average transfer time
    if (handoff.metrics?.transferTime) {
      const currentAvg = this.metrics.averageTransferTime;
      const count = this.metrics.totalHandoffs;
      this.metrics.averageTransferTime = 
        (currentAvg * (count - 1) + handoff.metrics.transferTime) / count;
    }
    
    // Calculate context loss rate
    if (handoff.metrics?.integrityScore) {
      const loss = 1 - handoff.metrics.integrityScore;
      const currentLoss = this.metrics.contextLossRate;
      const count = this.metrics.totalHandoffs;
      this.metrics.contextLossRate = 
        (currentLoss * (count - 1) + loss) / count;
    }
  }
  
  // Monitoring methods
  
  startMonitoring() {
    // Monitor active agents every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitorActiveAgents();
    }, 30000);
  }
  
  async monitorActiveAgents() {
    for (const [agentId, agentInfo] of this.activeAgents.entries()) {
      // Get current metrics
      const metrics = await this.collectAgentMetrics(agentId);
      
      // Store metrics
      this.agentMetrics.set(agentId, metrics);
      
      // Check for handoff triggers
      if (this.config.enableAutoHandoff) {
        await this.detectHandoffNeed(metrics);
      }
    }
  }
  
  async collectAgentMetrics(agentId) {
    const agent = this.activeAgents.get(agentId);
    
    return {
      agentId,
      agentType: agent?.type || 'unknown',
      currentTask: agent?.currentTask,
      errorRate: Math.random() * 0.2, // Simulated
      responseTime: Math.random() * 5000,
      retryCount: 0,
      memoryUsage: Math.random(),
      cpuUsage: Math.random(),
      taskDuration: agent ? Date.now() - agent.startTime : 0,
      progressRate: Math.random(),
      lastProgress: Date.now()
    };
  }
  
  // Persistence methods
  
  async loadHandoffHistory() {
    try {
      const historyPath = path.join(this.config.handoffHistoryPath, 'history.json');
      
      if (await this.fileExists(historyPath)) {
        const data = await fs.readFile(historyPath, 'utf8');
        this.handoffHistory = JSON.parse(data);
        logger.info(`🟢 Loaded ${this.handoffHistory.length} handoff records`);
      }
    } catch (error) {
      logger.error('Failed to load handoff history:', error);
    }
  }
  
  async saveHandoffHistory() {
    try {
      const historyPath = path.join(this.config.handoffHistoryPath, 'history.json');
      
      // Keep only recent history (last 1000 records)
      const recentHistory = this.handoffHistory.slice(-1000);
      
      await fs.writeFile(historyPath, JSON.stringify(recentHistory, null, 2));
    } catch (error) {
      logger.error('Failed to save handoff history:', error);
    }
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Register an agent's expertise
   */
  registerAgentExpertise(agentType, expertise) {
    this.agentExpertise.set(agentType, expertise);
    
    logger.info(`🟢 Registered expertise for ${agentType}`);
  }
  
  /**
   * Get handoff metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeAgents: this.activeAgents.size,
      queueLength: this.handoffQueue.length,
      activeHandoffs: this.activeHandoffs.size,
      historySize: this.handoffHistory.length
    };
  }
  
  /**
   * Manual handoff request
   */
  async requestHandoff(fromAgent, toAgent, reason = 'Manual request') {
    const triggers = [{
      type: 'explicit',
      reason,
      severity: 'high'
    }];
    
    return await this.initiateHandoff(fromAgent, triggers);
  }
}

// Export singleton
let instance = null;

module.exports = {
  SmartHandoffManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new SmartHandoffManager(config);
    }
    return instance;
  }
};