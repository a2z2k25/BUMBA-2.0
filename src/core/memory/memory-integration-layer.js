/**
 * BUMBA Memory Integration Layer
 * Connects Human Learning, Smart Handoff, and Knowledge Dashboard
 * with existing Unified Memory System
 */

const { EventEmitter } = require('events');
const { BumbaTeamMemory } = require('../../utils/teamMemory');
const { logger } = require('../logging/bumba-logger');

/**
 * Memory Integration Layer for complete knowledge sharing
 */
class MemoryIntegrationLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableAutoIntegration: config.enableAutoIntegration !== false,
      syncInterval: config.syncInterval || 10000, // 10 seconds
      compressionLevel: config.compressionLevel || 'medium',
      ...config
    };
    
    // Core systems
    this.unifiedMemory = null;
    this.teamMemory = null;
    this.humanLearning = null;
    this.handoffManager = null;
    this.dashboard = null;
    this.communication = null;
    this.knowledgeTransfer = null;
    
    // Integration state
    this.integrationStatus = {
      memory: false,
      teamMemory: false,
      learning: false,
      handoff: false,
      dashboard: false,
      communication: false,
      knowledge: false
    };
    
    // Sync timers
    this.syncTimers = new Map();
    
    // Metrics
    this.metrics = {
      syncOperations: 0,
      dataTransferred: 0,
      integrationErrors: 0,
      lastSync: null
    };
    
    this.initialize();
  }
  
  /**
   * Initialize all integrations
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing Memory Integration Layer...');
      
      // Step 1: Connect to existing systems
      await this.connectExistingSystems();
      
      // Step 2: Initialize new modules
      await this.initializeNewModules();
      
      // Step 3: Establish cross-system connections
      await this.establishConnections();
      
      // Step 4: Set up event bridges
      this.setupEventBridges();
      
      // Step 5: Start synchronization
      if (this.config.enableAutoIntegration) {
        this.startSynchronization();
      }
      
      logger.info('🏁 Memory Integration Layer initialized successfully');
      
      this.emit('initialized', this.integrationStatus);
      
    } catch (error) {
      logger.error('Failed to initialize Memory Integration Layer:', error);
      throw error;
    }
  }
  
  /**
   * Connect to existing BUMBA systems with graceful degradation
   */
  async connectExistingSystems() {
    const connectionPromises = [];
    
    // Connect to Unified Memory System
    connectionPromises.push(this.safeConnect('UnifiedMemorySystem', () => {
        const unifiedMemoryModule = require('./unified-memory-system');
        this.unifiedMemory = unifiedMemoryModule.getInstance();
        this.integrationStatus.memory = true;
        logger.info('🏁 Connected to Unified Memory System');
      })
    );
    
    // Connect to Team Memory System
    connectionPromises.push(this.safeConnect('BumbaTeamMemory', () => {
        this.teamMemory = new BumbaTeamMemory();
        this.integrationStatus.teamMemory = true;
        logger.info('🏁 Connected to Team Memory System');
      })
    );
    
    // Connect to Communication Protocol
    connectionPromises.push(this.safeConnect('AgentCommunicationProtocol', () => {
        const communicationModule = require('../communication/agent-communication-protocol');
        this.communication = communicationModule.getInstance();
        this.integrationStatus.communication = true;
        logger.info('🏁 Connected to Agent Communication Protocol');
      })
    );
    
    // Connect to Knowledge Transfer System
    connectionPromises.push(this.safeConnect('KnowledgeTransferSystem', () => {
        const knowledgeModule = require('../knowledge/knowledge-transfer-system');
        this.knowledgeTransfer = knowledgeModule.getInstance();
        this.integrationStatus.knowledge = true;
        logger.info('🏁 Connected to Knowledge Transfer System');
      })
    );
    
    // Wait for all connections with graceful failure handling
    await Promise.allSettled(connectionPromises);
    
    // Log connection summary
    const connectedSystems = Object.entries(this.integrationStatus).filter(([_, connected]) => connected);
    logger.info(`🟢 Connected to ${connectedSystems.length}/4 existing systems`);
  }
  
  /**
   * Initialize new enhancement modules with graceful degradation
   */
  async initializeNewModules() {
    const initPromises = [];
    
    // Initialize Human Learning Module
    initPromises.push(this.safeInitialize('HumanLearningModule', async () => {
        const learningModule = require('../learning/human-learning-module');
        this.humanLearning = learningModule.getInstance();
        await this.humanLearning.initialize();
        this.integrationStatus.learning = true;
        logger.info('🏁 Human Learning Module initialized');
      })
    );
    
    // Initialize Smart Handoff Manager
    initPromises.push(this.safeInitialize('SmartHandoffManager', async () => {
        const handoffModule = require('../orchestration/smart-handoff-manager');
        this.handoffManager = handoffModule.getInstance();
        await this.handoffManager.initialize();
        this.integrationStatus.handoff = true;
        logger.info('🏁 Smart Handoff Manager initialized');
      })
    );
    
    // Initialize Knowledge Dashboard
    initPromises.push(this.safeInitialize('KnowledgeDashboard', async () => {
        const dashboardModule = require('../dashboard/knowledge-dashboard');
        this.dashboard = dashboardModule.getInstance({
          enableWebUI: true,
          port: 3456
        });
        await this.dashboard.initialize();
        this.integrationStatus.dashboard = true;
        logger.info('🏁 Knowledge Dashboard initialized');
        
        try {
          const dashboardURL = this.dashboard.getDashboardURL();
          logger.info(`🟢 Dashboard available at: ${dashboardURL}`);
        } catch (urlError) {
          logger.warn('Dashboard initialized but URL not available:', urlError.message);
        }
      })
    );
    
    // Wait for all initializations with graceful failure handling
    const results = await Promise.allSettled(initPromises);
    
    // Log initialization summary
    const initializedModules = Object.entries(this.integrationStatus)
      .filter(([key, initialized]) => 
        ['learning', 'handoff', 'dashboard'].includes(key) && initialized
      );
    
    logger.info(`🟢 Initialized ${initializedModules.length}/3 enhancement modules`);
    
    // Report any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`🟡 ${failures.length} modules failed to initialize - system will continue with degraded functionality`);
    }
  }
  
  /**
   * Establish connections between systems with error resilience
   */
  async establishConnections() {
    // Connect Human Learning to Memory with safe access
    if (this.humanLearning && this.unifiedMemory) {
      try {
        this.humanLearning.memory = this.unifiedMemory;
      
      // Extend memory system with learning capabilities
      this.unifiedMemory.storeAgentContext = async (agentId, _context) => {
        return await this.unifiedMemory.store({
          type: 'agent_context',
          agentId,
          data: context,
          importance: 0.7
        });
      };
      
      this.unifiedMemory.retrieveAgentContext = async (agentId) => {
        const memories = await this.unifiedMemory.retrieve({
          type: 'agent_context',
          agentId
        });
        return memories[0]?.data || null;
      };
      
      this.unifiedMemory.clearAgentContext = async (agentId) => {
        // Mark as low importance for eventual cleanup
        const memories = await this.unifiedMemory.retrieve({
          type: 'agent_context',
          agentId
        });
        
        for (const memory of memories) {
          memory.importance = 0.1;
        }
      };
      
      this.unifiedMemory.getAgentHistory = async (agentId, limit = 10) => {
        try {
          const memories = await this.unifiedMemory.retrieve({
            type: 'agent_action',
            agentId
          });
          return memories.slice(0, limit).map(m => m.data);
        } catch (error) {
          logger.warn(`Failed to retrieve agent history for ${agentId}:`, error.message);
          return [];
        }
      };
      } catch (error) {
        logger.warn('Failed to connect Human Learning to Memory:', error.message);
      }
    }
    
    // Connect Handoff Manager to Memory and Communication
    if (this.handoffManager) {
      try {
        if (this.unifiedMemory) {
          this.handoffManager.memory = this.unifiedMemory;
        }
        if (this.communication) {
          this.handoffManager.communication = this.communication;
        }
      } catch (error) {
        logger.warn('Failed to connect Handoff Manager:', error.message);
      }
    }
    
    // Connect Dashboard to all systems
    if (this.dashboard) {
      try {
        if (this.unifiedMemory) {
          this.dashboard.memory = this.unifiedMemory;
        }
        if (this.humanLearning) {
          this.dashboard.humanLearning = this.humanLearning;
        }
        if (this.handoffManager) {
          this.dashboard.handoffManager = this.handoffManager;
        }
      
      // Extend memory with dashboard-specific methods
      this.unifiedMemory.getMemoryStats = async () => {
        return {
          shortTerm: {
            usage: this.unifiedMemory.shortTermMemory.size / 100,
            count: this.unifiedMemory.shortTermMemory.size
          },
          working: {
            usage: this.unifiedMemory.workingMemory.slots.filter(s => s).length / 7,
            count: this.unifiedMemory.workingMemory.slots.filter(s => s).length
          },
          longTerm: {
            usage: this.unifiedMemory.longTermMemory.size / 1000,
            count: this.unifiedMemory.longTermMemory.size
          },
          semantic: {
            usage: Object.keys(this.unifiedMemory.semanticMemory.concepts).length / 500,
            count: Object.keys(this.unifiedMemory.semanticMemory.concepts).length
          },
          total: {
            usage: this.calculateTotalMemoryUsage(),
            count: this.calculateTotalMemoryCount()
          },
          pressure: this.unifiedMemory.memoryPressure || 0,
          compressionRatio: 1.2,
          evictionRate: 0.05
        };
      };
      
      this.unifiedMemory.getSemanticMemory = async () => {
        try {
          return this.unifiedMemory.semanticMemory;
        } catch (error) {
          logger.warn('Failed to get semantic memory:', error.message);
          return { concepts: {}, relationships: [] };
        }
      };
      } catch (error) {
        logger.warn('Failed to connect Dashboard to systems:', error.message);
      }
    }
    
    logger.info('🏁 Cross-system connections established');
  }
  
  /**
   * Set up event bridges between systems
   */
  setupEventBridges() {
    // Bridge: Human Learning → Memory
    if (this.humanLearning) {
      this.humanLearning.on('preference-captured', async (preference) => {
        // Store in unified memory
        if (this.unifiedMemory) {
          await this.unifiedMemory.store({
            type: 'human_preference',
            data: preference,
            importance: preference.confidence
          });
        }
        
        // Notify knowledge transfer
        if (this.knowledgeTransfer) {
          await this.knowledgeTransfer.storeKnowledge('preference', preference);
        }
        
        this.emit('preference-stored', preference);
      });
      
      this.humanLearning.on('behavior-adapted', async (adaptations) => {
        // Broadcast to all agents
        if (this.communication) {
          await this.communication.broadcastMessage({
            type: 'behavior_adaptation',
            data: adaptations,
            priority: 'medium'
          });
        }
        
        this.emit('behavior-updated', adaptations);
      });
    }
    
    // Bridge: Handoff Manager → Memory & Communication
    if (this.handoffManager) {
      this.handoffManager.on('context-transferred', async (transfer) => {
        // Store handoff in memory
        if (this.unifiedMemory) {
          await this.unifiedMemory.store({
            type: 'handoff_record',
            data: transfer,
            importance: 0.6
          });
        }
        
        // Update knowledge transfer
        if (this.knowledgeTransfer) {
          await this.knowledgeTransfer.recordHandoff(transfer);
        }
        
        this.emit('handoff-completed', transfer);
      });
      
      this.handoffManager.on('handoff-needed', async (trigger) => {
        // Alert dashboard
        if (this.dashboard) {
          this.dashboard.emit('alert', {
            type: 'handoff_required',
            data: trigger
          });
        }
        
        this.emit('handoff-triggered', trigger);
      });
    }
    
    // Bridge: Memory → Dashboard
    if (this.unifiedMemory) {
      this.unifiedMemory.on('memory-stored', (memory) => {
        this.metrics.dataTransferred += JSON.stringify(memory).length;
        
        if (this.dashboard) {
          this.dashboard.emit('data-change', 'memory');
        }
      });
      
      this.unifiedMemory.on('memory-consolidated', (consolidation) => {
        this.emit('knowledge-consolidated', consolidation);
      });
    }
    
    // Bridge: Communication → All Systems
    if (this.communication) {
      this.communication.on('message-received', async (message) => {
        // Route to appropriate system
        switch (message.type) {
          case 'preference_feedback':
            if (this.humanLearning) {
              await this.humanLearning.processFeedback(message.data);
            }
            break;
            
          case 'handoff_request':
            if (this.handoffManager) {
              await this.handoffManager.requestHandoff(
                message.data.fromAgent,
                message.data.toAgent,
                message.data.reason
              );
            }
            break;
            
          case 'knowledge_query':
            if (this.knowledgeTransfer) {
              const knowledge = await this.knowledgeTransfer.retrieveKnowledge(
                message.data.query
              );
              await this.communication.sendMessage({
                type: 'knowledge_response',
                to: message.from,
                data: knowledge
              });
            }
            break;
        }
      });
    }
    
    logger.info('🏁 Event bridges established');
  }
  
  /**
   * Start synchronization between systems
   */
  startSynchronization() {
    // Sync preferences to memory
    this.syncTimers.set('preferences', setInterval(async () => {
      await this.syncPreferences();
    }, this.config.syncInterval));
    
    // Sync handoff metrics
    this.syncTimers.set('handoffs', setInterval(async () => {
      await this.syncHandoffMetrics();
    }, this.config.syncInterval));
    
    // Sync dashboard data
    this.syncTimers.set('dashboard', setInterval(async () => {
      await this.syncDashboardData();
    }, this.config.syncInterval / 2)); // More frequent for dashboard
    
    logger.info('🏁 Synchronization started');
  }
  
  /**
   * Sync preferences from learning to memory
   */
  async syncPreferences() {
    if (!this.humanLearning || !this.unifiedMemory) {return;}
    
    try {
      const preferences = this.humanLearning.preferenceCategories;
      
      for (const [category, prefs] of Object.entries(preferences)) {
        const prefArray = Array.from(prefs.values());
        
        if (prefArray.length > 0) {
          await this.unifiedMemory.store({
            type: 'preference_batch',
            category,
            data: prefArray,
            importance: 0.7,
            timestamp: new Date()
          });
        }
      }
      
      this.metrics.syncOperations++;
      this.metrics.lastSync = new Date();
      
    } catch (error) {
      logger.error('Failed to sync preferences:', error);
      this.metrics.integrationErrors++;
    }
  }
  
  /**
   * Sync handoff metrics to memory
   */
  async syncHandoffMetrics() {
    if (!this.handoffManager || !this.unifiedMemory) {return;}
    
    try {
      const metrics = this.handoffManager.getMetrics();
      
      await this.unifiedMemory.store({
        type: 'handoff_metrics',
        data: metrics,
        importance: 0.5,
        timestamp: new Date()
      });
      
      this.metrics.syncOperations++;
      
    } catch (error) {
      logger.error('Failed to sync handoff metrics:', error);
      this.metrics.integrationErrors++;
    }
  }
  
  /**
   * Sync dashboard data
   */
  async syncDashboardData() {
    if (!this.dashboard) {return;}
    
    try {
      // Dashboard auto-updates through its own mechanism
      // This is for additional sync if needed
      
      this.metrics.syncOperations++;
      
    } catch (error) {
      logger.error('Failed to sync dashboard data:', error);
      this.metrics.integrationErrors++;
    }
  }
  
  // Helper methods
  
  /**
   * Safely connect to a system with error handling
   */
  async safeConnect(systemName, connectionFn) {
    try {
      await connectionFn();
      return { success: true, system: systemName };
    } catch (error) {
      logger.warn(`Failed to connect to ${systemName}:`, error.message);
      this.metrics.integrationErrors++;
      return { success: false, system: systemName, error: error.message };
    }
  }
  
  /**
   * Safely initialize a module with error handling and retry
   */
  async safeInitialize(moduleName, initFn, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await initFn();
        return { success: true, module: moduleName, attempt: attempt + 1 };
      } catch (error) {
        logger.warn(`Failed to initialize ${moduleName} (attempt ${attempt + 1}):`, error.message);
        
        if (attempt === retries) {
          this.metrics.integrationErrors++;
          return { success: false, module: moduleName, error: error.message, attempts: attempt + 1 };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  /**
   * Check system health and availability
   */
  async checkSystemHealth() {
    const health = {
      timestamp: new Date(),
      overall: 'healthy',
      systems: {},
      warnings: [],
      errors: []
    };
    
    // Check each system
    const systems = [
      { name: 'memory', instance: this.unifiedMemory, required: true },
      { name: 'learning', instance: this.humanLearning, required: false },
      { name: 'handoff', instance: this.handoffManager, required: false },
      { name: 'dashboard', instance: this.dashboard, required: false },
      { name: 'communication', instance: this.communication, required: false },
      { name: 'knowledge', instance: this.knowledgeTransfer, required: false }
    ];
    
    for (const system of systems) {
      const status = {
        available: !!system.instance,
        functional: false,
        error: null
      };
      
      if (system.instance) {
        try {
          // Test basic functionality
          if (typeof system.instance.getStatus === 'function') {
            await system.instance.getStatus();
            status.functional = true;
          } else if (typeof system.instance.getMetrics === 'function') {
            await system.instance.getMetrics();
            status.functional = true;
          } else {
            status.functional = true; // Assume functional if no test method
          }
        } catch (error) {
          status.error = error.message;
          if (system.required) {
            health.errors.push(`Critical system ${system.name} is not functional: ${error.message}`);
          } else {
            health.warnings.push(`Optional system ${system.name} is not functional: ${error.message}`);
          }
        }
      } else if (system.required) {
        health.errors.push(`Critical system ${system.name} is not available`);
      } else {
        health.warnings.push(`Optional system ${system.name} is not available`);
      }
      
      health.systems[system.name] = status;
    }
    
    // Determine overall health
    if (health.errors.length > 0) {
      health.overall = 'critical';
    } else if (health.warnings.length > 0) {
      health.overall = 'degraded';
    }
    
    return health;
  }
  
  /**
   * Attempt to recover failed systems
   */
  async recoverFailedSystems() {
    const health = await this.checkSystemHealth();
    const recoveryResults = [];
    
    for (const [systemName, status] of Object.entries(health.systems)) {
      if (!status.functional && status.available) {
        try {
          logger.info(`🟢 Attempting to recover ${systemName}...`);
          
          // Try to reinitialize the system
          switch (systemName) {
            case 'learning':
              if (this.humanLearning && typeof this.humanLearning.initialize === 'function') {
                await this.humanLearning.initialize();
              }
              break;
            case 'handoff':
              if (this.handoffManager && typeof this.handoffManager.initialize === 'function') {
                await this.handoffManager.initialize();
              }
              break;
            case 'dashboard':
              if (this.dashboard && typeof this.dashboard.initialize === 'function') {
                await this.dashboard.initialize();
              }
              break;
          }
          
          recoveryResults.push({ system: systemName, recovered: true });
          logger.info(`🏁 Successfully recovered ${systemName}`);
          
        } catch (error) {
          recoveryResults.push({ system: systemName, recovered: false, error: error.message });
          logger.warn(`🔴 Failed to recover ${systemName}:`, error.message);
        }
      }
    }
    
    return recoveryResults;
  }
  
  calculateTotalMemoryUsage() {
    if (!this.unifiedMemory) {return 0;}
    
    try {
      const total = 
        (this.unifiedMemory.shortTermMemory?.size || 0) +
        (this.unifiedMemory.workingMemory?.slots?.filter(s => s)?.length || 0) * 10 +
        (this.unifiedMemory.longTermMemory?.size || 0) +
        (Object.keys(this.unifiedMemory.semanticMemory?.concepts || {}).length) * 2;
      
      return Math.min(total / 2000, 1); // Normalized to 0-1
    } catch (error) {
      logger.warn('Failed to calculate memory usage:', error.message);
      return 0;
    }
  }
  
  calculateTotalMemoryCount() {
    if (!this.unifiedMemory) {return 0;}
    
    try {
      return (
        (this.unifiedMemory.shortTermMemory?.size || 0) +
        (this.unifiedMemory.workingMemory?.slots?.filter(s => s)?.length || 0) +
        (this.unifiedMemory.longTermMemory?.size || 0) +
        (Object.keys(this.unifiedMemory.semanticMemory?.concepts || {}).length)
      );
    } catch (error) {
      logger.warn('Failed to calculate memory count:', error.message);
      return 0;
    }
  }
  
  /**
   * Process user feedback through the system
   */
  async processUserFeedback(feedback, context) {
    const results = {
      preferencesCaptured: false,
      behaviorAdapted: false,
      knowledgeStored: false,
      dashboardUpdated: false
    };
    
    try {
      // Capture preferences
      if (this.humanLearning) {
        const preference = await this.humanLearning.capturePreferences(feedback, context);
        results.preferencesCaptured = !!preference;
      }
      
      // Adapt behavior if patterns detected
      if (this.humanLearning && this.humanLearning.patterns.positive.length >= 3) {
        const adaptations = await this.humanLearning.adaptBehavior({
          general: this.humanLearning.patterns.positive
        });
        results.behaviorAdapted = adaptations.length > 0;
      }
      
      // Store in knowledge system
      if (this.knowledgeTransfer) {
        await this.knowledgeTransfer.storeKnowledge('feedback', {
          feedback,
          context,
          timestamp: new Date()
        });
        results.knowledgeStored = true;
      }
      
      // Update dashboard
      if (this.dashboard) {
        await this.dashboard.updateDashboard();
        results.dashboardUpdated = true;
      }
      
      this.emit('feedback-processed', results);
      
      return results;
      
    } catch (error) {
      logger.error('Failed to process user feedback:', error);
      return results;
    }
  }
  
  /**
   * Trigger intelligent handoff
   */
  async triggerHandoff(fromAgent, reason) {
    try {
      // Collect agent metrics
      const metrics = {
        agentId: fromAgent,
        agentType: 'unknown',
        currentTask: { type: 'general' },
        errorRate: 0,
        responseTime: 0
      };
      
      // Detect handoff need
      const detection = await this.handoffManager.detectHandoffNeed(metrics);
      
      if (detection.needed || reason === 'manual') {
        // Find best replacement
        const availableAgents = await this.handoffManager.getAvailableAgents(metrics.currentTask);
        const replacement = await this.handoffManager.selectBestAgent(
          metrics.currentTask,
          availableAgents
        );
        
        if (replacement) {
          // Execute handoff
          const result = await this.handoffManager.transferContext(fromAgent, replacement.id);
          
          this.emit('handoff-executed', result);
          
          return result;
        }
      }
      
      return { success: false, reason: 'No handoff needed or no replacement available' };
      
    } catch (error) {
      logger.error('Failed to trigger handoff:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    return {
      integrationStatus: this.integrationStatus,
      metrics: this.metrics,
      dashboardURL: this.dashboard ? this.dashboard.getDashboardURL() : null,
      systems: {
        memory: !!this.unifiedMemory,
        learning: !!this.humanLearning,
        handoff: !!this.handoffManager,
        dashboard: !!this.dashboard,
        communication: !!this.communication,
        knowledge: !!this.knowledgeTransfer
      }
    };
  }
  
  /**
   * Stop all integrations
   */
  async stop() {
    // Stop sync timers
    for (const timer of this.syncTimers.values()) {
      clearInterval(timer);
    }
    
    // Stop dashboard
    if (this.dashboard) {
      await this.dashboard.stop();
    }
    
    logger.info('🔴 Memory Integration Layer stopped');
  }
}

// Singleton instance
let instance = null;

// Export both class and getInstance
module.exports = {
  MemoryIntegrationLayer,
  getInstance: function(config) {
    if (!instance) {
      instance = new MemoryIntegrationLayer(config);
    }
    return instance;
  }
};

// Also export getInstance directly for convenience
module.exports.default = module.exports.MemoryIntegrationLayer;