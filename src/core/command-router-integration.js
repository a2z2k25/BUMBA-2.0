/**
 * BUMBA Command Router Integration
 * Bridges command handlers with intelligent agent routing
 * Ensures domain-specific commands reach the correct agents
 */

const { UnifiedRoutingSystem } = require('./unified-routing-system');
const { BumbaAgentManager } = require('./agents');
const { RoutingLearningSystem } = require('./routing/routing-learning-system');
const { logger } = require('./logging/bumba-logger');

class CommandRouterIntegration {
  constructor(config = {}) {
    this.config = config;
    
    // Initialize routing system
    this.routingSystem = new UnifiedRoutingSystem();
    
    // Initialize agent manager
    this.agentManager = new BumbaAgentManager(config);
    
    // Initialize learning system
    this.learningSystem = new RoutingLearningSystem(config);
    
    // Department to manager mapping
    this.departmentManagers = {
      'strategic': 'product-strategist',
      'experience': 'design-engineer-manager',
      'technical': 'backend-engineer-manager'
    };
    
    // Specialist mapping by domain
    this.specialistDomains = {
      // Strategic specialists
      'market-research-specialist': 'strategic',
      'product-owner': 'strategic',
      'business-analyst': 'strategic',
      'technical-writer': 'strategic',
      
      // Experience specialists  
      'ux-research-specialist': 'experience',
      'ui-designer': 'experience',
      'frontend-specialist': 'experience',
      'accessibility-specialist': 'experience',
      
      // Technical specialists
      'security-specialist': 'technical',
      'database-specialist': 'technical',
      'devops-engineer': 'technical',
      'backend-developer': 'technical',
      'api-specialist': 'technical',
      
      // Language specialists (technical)
      'javascript-specialist': 'technical',
      'python-specialist': 'technical',
      'golang-specialist': 'technical',
      'rust-specialist': 'technical'
    };
  }
  
  /**
   * Route command to appropriate agent with model assignment
   */
  async routeCommand(command, args = [], context = {}) {
    try {
      // Step 1: Check learning system for previous successful routings
      const learned = this.learningSystem.getLearnedRouting(command, args);
      
      if (learned.found && learned.confidence > 0.8) {
        logger.info(`🟢 Using learned routing with confidence ${learned.confidence}`);
        
        // Use learned routing but still verify model assignments
        const agentsWithModels = await this.assignModels(learned.routing.agents, learned.routing);
        
        return this.createExecutionPlan(
          command,
          args,
          agentsWithModels,
          { confidence: learned.confidence, source: learned.source }
        );
      }
      
      // Step 2: Analyze intent
      const analysis = this.routingSystem.analyzer.analyzeIntent(
        command, 
        args, 
        context
      );
      
      logger.info('🟢 Command Analysis:', {
        command,
        intent: analysis.primaryIntent,
        departments: analysis.departments,
        specialists: analysis.specialists,
        complexity: analysis.complexity,
        confidence: analysis.confidence
      });
      
      // Step 3: Get recommendations from learning system
      const recommendations = this.learningSystem.getRecommendations(command, args, analysis);
      if (recommendations.length > 0) {
        logger.info('🟢 Learning recommendations:', recommendations);
      }
      
      // Step 4: Determine routing strategy
      const routingStrategy = this.determineRoutingStrategy(analysis);
      
      // Step 5: Select agents based on strategy
      const selectedAgents = await this.selectAgents(routingStrategy, analysis);
      
      // Step 6: Assign models to agents
      const agentsWithModels = await this.assignModels(selectedAgents, routingStrategy);
      
      // Step 7: Create execution plan
      const executionPlan = this.createExecutionPlan(
        command,
        args,
        agentsWithModels,
        analysis
      );
      
      // Store routing plan for learning (will be updated with result later)
      executionPlan.learningId = `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('🏁 Routing Complete:', {
        strategy: routingStrategy.type,
        agents: agentsWithModels.map(a => a.agent),
        models: agentsWithModels.map(a => a.model)
      });
      
      return executionPlan;
      
    } catch (error) {
      logger.error(`🔴 Command routing failed: ${error.message}`);
      
      // Fallback to default routing
      return this.fallbackRouting(command, args, context);
    }
  }
  
  /**
   * Determine routing strategy based on analysis
   */
  determineRoutingStrategy(analysis) {
    const { complexity, confidence, departments, specialists, isExecutiveLevel } = analysis;
    
    // Executive level - needs Product Strategist with Claude Max
    if (isExecutiveLevel || complexity > 0.8) {
      return {
        type: 'executive',
        requiresClaudeMax: true,
        manager: 'product-strategist-executive',
        departments: departments,
        specialists: specialists
      };
    }
    
    // Cross-domain - multiple managers needed
    if (departments.length > 1) {
      return {
        type: 'cross-domain',
        requiresClaudeMax: true, // Executive gets it
        managers: departments.map(d => this.departmentManagers[d]),
        specialists: specialists
      };
    }
    
    // Single domain with specialists
    if (departments.length === 1 && specialists.length > 0) {
      return {
        type: 'domain-specific',
        requiresClaudeMax: true, // Manager gets it
        manager: this.departmentManagers[departments[0]],
        specialists: specialists
      };
    }
    
    // Simple task - single specialist
    if (specialists.length === 1) {
      return {
        type: 'specialist-only',
        requiresClaudeMax: false,
        specialist: specialists[0]
      };
    }
    
    // Default - use primary department
    return {
      type: 'default',
      requiresClaudeMax: false,
      department: departments[0] || 'technical'
    };
  }
  
  /**
   * Select specific agents based on routing strategy
   */
  async selectAgents(strategy, analysis) {
    const agents = [];
    
    switch (strategy.type) {
      case 'executive':
        // Executive manager
        agents.push({
          agent: 'product-strategist-executive',
          role: 'executive',
          type: 'manager'
        });
        
        // Add department managers if needed
        if (strategy.departments.length > 1) {
          strategy.departments.forEach(dept => {
            if (dept !== 'strategic') { // Executive already covers strategic
              agents.push({
                agent: this.departmentManagers[dept],
                role: 'manager',
                type: 'manager'
              });
            }
          });
        }
        
        // Add specialists
        strategy.specialists.forEach(spec => {
          agents.push({
            agent: spec,
            role: 'specialist',
            type: 'worker'
          });
        });
        break;
        
      case 'cross-domain':
        // Multiple managers
        strategy.managers.forEach(manager => {
          agents.push({
            agent: manager,
            role: 'manager',
            type: 'manager'
          });
        });
        
        // Add specialists
        strategy.specialists.forEach(spec => {
          agents.push({
            agent: spec,
            role: 'specialist',
            type: 'worker'
          });
        });
        break;
        
      case 'domain-specific':
        // Single manager
        agents.push({
          agent: strategy.manager,
          role: 'manager',
          type: 'manager'
        });
        
        // Add specialists
        strategy.specialists.forEach(spec => {
          agents.push({
            agent: spec,
            role: 'specialist',
            type: 'worker'
          });
        });
        break;
        
      case 'specialist-only':
        // Just the specialist
        agents.push({
          agent: strategy.specialist,
          role: 'specialist',
          type: 'worker'
        });
        break;
        
      default:
        // Determine best agent for department
        const manager = this.departmentManagers[strategy.department];
        if (manager) {
          agents.push({
            agent: manager,
            role: 'manager',
            type: 'manager'
          });
        }
        break;
    }
    
    return agents;
  }
  
  /**
   * Assign models to selected agents
   */
  async assignModels(agents, strategy) {
    // Use our hierarchical system for model assignment
    const { managers, workers } = await this.agentManager.hierarchicalSystem.assignModelsForExecution(agents);
    
    const allAgents = [...managers, ...workers];
    
    // Map task types for workers
    allAgents.forEach(agent => {
      if (agent.type === 'worker' && !agent.modelConfig) {
        // Determine task type from agent role
        const taskType = this.getTaskTypeFromAgent(agent.agent);
        agent.taskType = taskType;
      }
    });
    
    return allAgents;
  }
  
  /**
   * Get task type from agent name for model selection
   */
  getTaskTypeFromAgent(agentName) {
    // Coding agents
    if (agentName.includes('developer') || 
        agentName.includes('frontend') || 
        agentName.includes('backend') ||
        agentName.includes('api')) {
      return 'coding';
    }
    
    // Reasoning/analysis agents
    if (agentName.includes('analyst') || 
        agentName.includes('research') || 
        agentName.includes('security') ||
        agentName.includes('architect')) {
      return 'reasoning';
    }
    
    // General/documentation agents
    if (agentName.includes('writer') || 
        agentName.includes('designer') || 
        agentName.includes('ux')) {
      return 'general';
    }
    
    return 'general';
  }
  
  /**
   * Create execution plan with assigned agents and models
   */
  createExecutionPlan(command, args, agents, analysis) {
    return {
      command,
      args,
      analysis: {
        intent: analysis.primaryIntent,
        complexity: analysis.complexity,
        confidence: analysis.confidence
      },
      execution: {
        agents: agents.map(a => ({
          name: a.agent,
          role: a.role,
          type: a.type,
          model: a.modelConfig?.model || a.model,
          usingClaudeMax: a.usingClaudeMax || false
        })),
        parallel: agents.filter(a => a.type === 'worker').length > 1,
        requiresCoordination: agents.filter(a => a.type === 'manager').length > 1
      },
      routing: {
        source: 'intelligent-routing',
        confidence: analysis.confidence,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Fallback routing when analysis fails
   */
  fallbackRouting(command, args, context) {
    logger.warn('🟡 Using fallback routing');
    
    // Simple keyword-based routing
    let department = 'technical'; // default
    
    if (command.includes('design') || command.includes('ui')) {
      department = 'experience';
    } else if (command.includes('strategy') || command.includes('product')) {
      department = 'strategic';
    }
    
    return {
      command,
      args,
      execution: {
        agents: [{
          name: this.departmentManagers[department],
          role: 'manager',
          type: 'manager',
          model: 'claude-max',
          usingClaudeMax: true
        }],
        parallel: false,
        requiresCoordination: false
      },
      routing: {
        source: 'fallback',
        confidence: 0.3,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Record execution result for learning
   */
  async recordExecutionResult(executionPlan, result) {
    if (!executionPlan.learningId) {
      return; // No learning ID, skip recording
    }
    
    try {
      await this.learningSystem.learnFromRouting(
        executionPlan.command,
        executionPlan.args,
        executionPlan,
        result
      );
      
      logger.info('🟢 Recorded execution result for learning');
    } catch (error) {
      logger.error(`Failed to record learning: ${error.message}`);
    }
  }
  
  /**
   * Get routing statistics
   */
  getRoutingStats() {
    return {
      routingSystem: this.routingSystem.stats,
      agentManager: this.agentManager.getStatus(),
      departmentManagers: this.departmentManagers,
      specialistDomains: Object.keys(this.specialistDomains).length,
      learningStats: this.learningSystem.getStatistics()
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CommandRouterIntegration,
  getInstance: (config) => {
    if (!instance) {
      instance = new CommandRouterIntegration(config);
    }
    return instance;
  }
};