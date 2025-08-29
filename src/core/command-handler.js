/**
 * BUMBA Enhanced Command Handler
 * Properly registers and routes all 58 commands
 */

const chalk = require('chalk');
const { logger } = require('./logging/bumba-logger');
const { BumbaError } = require('./error-handling/bumba-error-system');
const { getInstance: getAgentIdentity } = require('./coordination/agent-identity');
const { getInstance: getSafeFileOps } = require('./coordination/safe-file-operations');
const { getInstance: getTerritoryManager } = require('./coordination/territory-manager');

class BumbaCommandHandler {
  constructor() {
    this.handlers = new Map();
    this.departments = new Map();
    this.hooks = null;
    this.orchestrationSystem = null;
    this.orchestrationEnabled = false;
    this.orchestrationConnected = false;

    // ENHANCED: Testing framework integration
    this.testingFramework = null;
    this.testingEnabled = true;
    
    // Intelligent command routing
    const { getInstance: getCommandRouter } = require('./command-intelligence/command-router');
    this.commandRouter = getCommandRouter();

    // CRITICAL: Coordination systems
    this.agentIdentity = getAgentIdentity();
    this.safeFileOps = getSafeFileOps();
    this.territoryManager = getTerritoryManager();

    // Register command handler as an agent
    this.agentId = this.agentIdentity.registerAgent(this, {
      type: 'CommandHandler',
      name: 'Main',
      capabilities: ['routing', 'orchestration'],
      priority: 10
    });

    // Register all commands
    this.registerAllCommands();

    logger.info(`🟢 Command Handler initialized with ${this.handlers.size} commands`);
  }

  registerAllCommands() {
    // Product Strategist Commands
    this.registerCommand('implement-strategy', this.handleProductCommand.bind(this));
    this.registerCommand('prd', this.handleProductCommand.bind(this));
    this.registerCommand('requirements', this.handleProductCommand.bind(this));
    this.registerCommand('roadmap', this.handleProductCommand.bind(this));
    this.registerCommand('research-market', this.handleProductCommand.bind(this));
    this.registerCommand('analyze-business', this.handleProductCommand.bind(this));
    this.registerCommand('docs-business', this.handleProductCommand.bind(this));
    this.registerCommand('improve-strategy', this.handleProductCommand.bind(this));

    // Design Engineer Commands
    this.registerCommand('implement-design', this.handleDesignCommand.bind(this));
    this.registerCommand('design', this.handleDesignCommand.bind(this));
    this.registerCommand('figma', this.handleDesignCommand.bind(this));
    this.registerCommand('ui', this.handleDesignCommand.bind(this));
    this.registerCommand('visual', this.handleDesignCommand.bind(this));
    this.registerCommand('research-design', this.handleDesignCommand.bind(this));
    this.registerCommand('analyze-ux', this.handleDesignCommand.bind(this));
    this.registerCommand('docs-design', this.handleDesignCommand.bind(this));
    this.registerCommand('improve-design', this.handleDesignCommand.bind(this));
    this.registerCommand('figma-context', this.handleDesignCommand.bind(this));

    // Backend Engineer Commands
    this.registerCommand('implement-technical', this.handleBackendCommand.bind(this));
    this.registerCommand('api', this.handleBackendCommand.bind(this));
    this.registerCommand('secure', this.handleBackendCommand.bind(this));
    this.registerCommand('scan', this.handleBackendCommand.bind(this));
    this.registerCommand('analyze-technical', this.handleBackendCommand.bind(this));
    this.registerCommand('devops', this.handleDevOpsCommand.bind(this));
    this.registerCommand('research-technical', this.handleBackendCommand.bind(this));
    this.registerCommand('docs-technical', this.handleBackendCommand.bind(this));
    this.registerCommand('improve-performance', this.handleBackendCommand.bind(this));
    this.registerCommand('publish', this.handleBackendCommand.bind(this));
    this.registerCommand('n8n', this.handleBackendCommand.bind(this));

    // Collaboration Commands
    this.registerCommand('implement-agents', this.handleCollaborationCommand.bind(this));
    this.registerCommand('team', this.handleCollaborationCommand.bind(this));
    this.registerCommand('collaborate', this.handleCollaborationCommand.bind(this));
    this.registerCommand('chain', this.handleCollaborationCommand.bind(this));
    this.registerCommand('workflow', this.handleCollaborationCommand.bind(this));
    this.registerCommand('checkpoint', this.handleCollaborationCommand.bind(this));

    // Global Commands
    this.registerCommand('implement', this.handleGlobalCommand.bind(this));
    this.registerCommand('analyze', this.handleGlobalCommand.bind(this));
    this.registerCommand('docs', this.handleGlobalCommand.bind(this));
    this.registerCommand('research', this.handleGlobalCommand.bind(this));
    this.registerCommand('snippets', this.handleGlobalCommand.bind(this));
    this.registerCommand('test', this.handleGlobalCommand.bind(this));
    this.registerCommand('validate', this.handleGlobalCommand.bind(this));
    this.registerCommand('improve', this.handleGlobalCommand.bind(this));

    // Consciousness Commands
    this.registerCommand('conscious-analyze', this.handleConsciousnessCommand.bind(this));
    this.registerCommand('conscious-reason', this.handleConsciousnessCommand.bind(this));
    this.registerCommand('conscious-wisdom', this.handleConsciousnessCommand.bind(this));
    this.registerCommand('conscious-purpose', this.handleConsciousnessCommand.bind(this));

    // Lite Mode Commands
    this.registerCommand('lite', this.handleLiteCommand.bind(this));
    this.registerCommand('lite-analyze', this.handleLiteCommand.bind(this));
    this.registerCommand('lite-implement', this.handleLiteCommand.bind(this));

    // System Commands
    this.registerCommand('menu', this.handleSystemCommand.bind(this));
    this.registerCommand('help', this.handleSystemCommand.bind(this));
    this.registerCommand('settings', this.handleSystemCommand.bind(this));
    this.registerCommand('orchestrate', this.handleSystemCommand.bind(this));
    this.registerCommand('memory', this.handleSystemCommand.bind(this));

    // Monitoring Commands
    this.registerCommand('health', this.handleMonitoringCommand.bind(this));
    this.registerCommand('metrics', this.handleMonitoringCommand.bind(this));
    this.registerCommand('profile', this.handleMonitoringCommand.bind(this));
    this.registerCommand('optimize', this.handleMonitoringCommand.bind(this));
    this.registerCommand('monitor', this.handleMonitoringCommand.bind(this));
    this.registerCommand('status', this.handleMonitoringCommand.bind(this));
    
    // Notion Sync Commands
    this.registerNotionCommands();
    
    // Operability Commands
    this.registerCommand('connect', this.handleConnectCommand.bind(this));
    this.registerCommand('operability', this.handleOperabilityCommand.bind(this));
  }
  
  registerNotionCommands() {
    try {
      const NotionSyncCommands = require('../commands/notion-sync-commands');
      const notionCommands = new NotionSyncCommands();
      
      // Register each Notion command
      for (const cmd of notionCommands.getAllCommands()) {
        const shortCmd = cmd.replace('notion:', '');
        this.registerCommand(`notion-${shortCmd}`, async (args, _context) => {
          const handler = notionCommands.getCommand(cmd);
          if (handler) {
            return await handler({ ...args }, context);
          }
          return { success: false, message: 'Command not found' };
        });
      }
      
      logger.info('🏁 Notion sync commands registered');
    } catch (error) {
      logger.warn('Could not register Notion commands:', error.message);
    }
  }

  registerCommand(name, handler) {
    this.handlers.set(name, handler);
  }

  // Alias for backward compatibility
  async execute(command, args = [], context = {}) {
    return this.handleCommand(command, args, context);
  }

  async handleCommand(command, args = [], context = {}) {
    // ENHANCED: Store original goal for completeness validation
    const originalGoal = `${command} ${args.join(' ')}`.trim();

    // Use intelligent command router for all commands
    if (this.commandRouter) {
      try {
        logger.info(`🚀 Using intelligent command router for: ${command}`);
        
        // Initialize router if needed
        if (!this.commandRouter.initialized) {
          await this.commandRouter.initialize();
        }
        
        const routerResult = await this.commandRouter.route(command, args, context);
        
        // Format result for consistency with existing system
        return {
          success: routerResult.success !== false,
          command,
          department: routerResult.department,
          result: routerResult,
          timestamp: new Date().toISOString()
        };
      } catch (routerError) {
        logger.warn(`Router failed for ${command}, falling back to legacy handler:`, routerError);
        // Continue with legacy handler below
      }
    }

    // CRITICAL: Create unique agent context for this command
    const commandAgentId = this.agentIdentity.generateAgentId('Command', command);
    context.agentId = commandAgentId;
    context.parentAgentId = this.agentId;

    // Register command as temporary agent
    this.agentIdentity.registerAgent({ command }, {
      type: 'CommandExecution',
      name: command,
      department: this.mapCommandToDepartment(command),
      temporary: true
    });

    // Create orchestration task for complex commands
    if (this.orchestrationEnabled && this.isComplexCommand(command)) {
      await this.createOrchestrationTask(command, args, context);
    }

    // Check if command exists
    if (this.handlers.has(command)) {
      const handler = this.handlers.get(command);

      // Trigger pre-execution hook
      if (this.hooks && typeof this.hooks !== "undefined") {
        await this.hooks.trigger('command:pre-execute', { command, args, context });
      }

      try {
        const result = await handler(args, context);

        // ENHANCED: Run testing validation on command results
        if (this.testingFramework && this.testingEnabled) {
          const testReport = await this.runCommandTesting(result, originalGoal);

          if (!testReport.passed) {
            logger.error(`🔴 Command testing failed: ${testReport.failures.join(', ')}`);
            // Attach test report to result for transparency
            result.testReport = testReport;
            result.testingFailed = true;
          } else {
            logger.info(`🏁 Command testing passed with ${testReport.coverage}% coverage`);
            result.testReport = testReport;
          }
        }

        // Update orchestration status
        if (this.orchestrationEnabled && typeof this.orchestrationEnabled !== "undefined") {
          await this.updateOrchestrationStatus(command, 'completed', result);
        }

        // Trigger post-execution hook
        if (this.hooks && typeof this.hooks !== "undefined") {
          await this.hooks.trigger('command:post-execute', { command, args, result, context });
        }

        return result;
      } catch (error) {
        // Update orchestration status on error
        if (this.orchestrationEnabled && typeof this.orchestrationEnabled !== "undefined") {
          await this.updateOrchestrationStatus(command, 'failed', error);
        }

        // Trigger error hook
        if (this.hooks && typeof this.hooks !== "undefined") {
          await this.hooks.trigger('command:error', { command, args, error, context });
        }
        throw error;
      }
    }

    // Fallback to department routing
    return this.routeToDepartment(command, args, context);
  }

  /**
   * Initialize orchestration integration
   */
  initializeOrchestration(orchestrationSystem) {
    this.orchestrationSystem = orchestrationSystem;
    this.orchestrationEnabled = true;
    this.orchestrationConnected = true;

    // Connect to orchestration components if available
    try {
      const orchestratorModule = require('./orchestration/task-orchestrator');
      const notionClientModule = require('./orchestration/notion-client');

      this.taskOrchestrator = orchestratorModule.getInstance();
      this.notionClient = notionClientModule.getInstance();

      logger.info('🏁 Command Handler fully connected to Orchestration System');
    } catch (error) {
      logger.warn('🟡 Command Handler using simplified orchestration:', error.message);
    }
  }

  /**
   * Check if command is complex enough for orchestration
   */
  isComplexCommand(command) {
    const complexCommands = [
      'implement', 'implement-strategy', 'implement-design', 'implement-technical',
      'analyze', 'analyze-business', 'analyze-ux', 'analyze-technical',
      'test', 'deploy', 'orchestrate', 'prd', 'roadmap', 'design'
    ];
    return complexCommands.some(cmd => command.includes(cmd));
  }

  /**
   * Create orchestration task for command
   */
  async createOrchestrationTask(command, args, context) {
    if (!this.orchestrationEnabled) {return;}

    try {
      const task = {
        id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        command,
        title: `Command: ${command}`,
        type: 'command',
        args,
        context,
        status: 'pending',
        priority: this.getCommandPriority(command),
        department: this.identifyDepartment(command),
        createdAt: new Date().toISOString()
      };

      logger.info(`🟢 Creating orchestration task for command: ${command}`);

      // Use task orchestrator if available
      if (this.taskOrchestrator && typeof this.taskOrchestrator !== "undefined") {
        const orchestratedTask = await this.taskOrchestrator.createTask(task);

        // Update Notion if available
        if (this.notionClient && typeof this.notionClient !== "undefined") {
          await this.notionClient.createTask({
            title: task.title,
            description: `Command: ${command}\nArgs: ${JSON.stringify(args)}`,
            status: 'To Do',
            priority: task.priority,
            assignee: task.department
          });
        }

        return orchestratedTask;
      }

      return task;
    } catch (error) {
      logger.error('Failed to create orchestration task:', error);
    }
  }

  /**
   * Update orchestration status for command
   */
  async updateOrchestrationStatus(command, status, data) {
    if (!this.orchestrationEnabled) {return;}

    try {
      logger.info(`🟢 Updating orchestration status: ${command} -> ${status}`);

      // Update task orchestrator if available
      if (this.taskOrchestrator && typeof this.taskOrchestrator !== "undefined") {
        await this.taskOrchestrator.updateTaskStatus(command, status);
      }

      // Update Notion if available
      if (this.notionClient && typeof this.notionClient !== "undefined") {
        const notionStatus = status === 'completed' ? 'Done' :
          status === 'failed' ? 'Failed' :
            status === 'in-progress' ? 'In Progress' : 'To Do';

        await this.notionClient.updateTaskStatus(command, notionStatus);
      }

      // Emit event for hooks
      if (this.hooks && typeof this.hooks !== "undefined") {
        await this.hooks.trigger(`command:${status}`, {
          command,
          status,
          data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to update orchestration status:', error);
    }
  }

  async handleProductCommand(args, context) {
    logger.info('🟢 Executing Product Strategy command');
    
    // Use intelligent routing
    const router = this.getCommandRouter();
    if (router) {
      return await router.routeCommand('product-strategy', args, context);
    }
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleProductCommand(args, context);
  }

  async handleDesignCommand(args, context) {
    logger.info('🟢 Executing Design Engineering command');
    
    // Use intelligent routing
    const router = this.getCommandRouter();
    if (router) {
      return await router.routeCommand('design-engineering', args, context);
    }
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleDesignCommand(args, context);
  }

  async handleBackendCommand(args, context) {
    logger.info('🟢 Executing Backend Engineering command');
    
    // Use intelligent routing
    const router = this.getCommandRouter();
    if (router) {
      return await router.routeCommand('backend-engineering', args, context);
    }
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleBackendCommand(args, context);
  }

  async handleCollaborationCommand(args, context) {
    logger.info('🟢 Executing Multi-Agent Collaboration');
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleCollaborationCommand(args, context);
  }

  async handleGlobalCommand(args, context) {
    logger.info('🟢 Executing Global command with intelligent routing');
    
    // Extract command from context or args
    const command = context.originalCommand || args[0] || 'analyze';
    
    // Use intelligent routing to determine best agent
    const router = this.getCommandRouter();
    if (router) {
      const routingResult = await router.routeCommand(command, args.slice(1), context);
      
      logger.info('🟢 Intelligent routing result:', {
        agents: routingResult.execution.agents.map(a => `${a.name} (${a.model})`),
        confidence: routingResult.routing.confidence
      });
      
      return routingResult;
    }
    
    // Fallback
    return {
      type: 'global',
      action: 'route',
      args,
      context
    };
  }

  async handleConsciousnessCommand(args, context) {
    logger.info('🟢 Executing Consciousness command');
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleConsciousnessCommand(args, context);
  }

  async handleLiteCommand(args, context) {
    logger.info('🟢 Executing Lite Mode command');
    
    try {
      // Get the lite mode instance
      const { bumba } = require('./bumba-lite');
      const lite = bumba();
      
      // Parse command from context
      const command = context.originalCommand || 'lite';
      const subCommand = command.replace('lite-', '').replace('lite', '');
      
      // Enable visual mode for better CLI experience
      lite.visual(true);
      
      // Handle different lite commands
      switch (subCommand) {
        case 'analyze':
        case 'analyse':
          const analyzePrompt = args.join(' ') || 'analyze the current codebase';
          const analyzeResult = await lite.develop(analyzePrompt, { type: 'analyze' });
          return {
            type: 'lite',
            action: 'analyze',
            success: analyzeResult.success,
            result: analyzeResult
          };
          
        case 'implement':
          const implementPrompt = args.join(' ') || 'implement a new feature';
          const implementResult = await lite.develop(implementPrompt, { type: 'implement' });
          return {
            type: 'lite',
            action: 'implement',
            success: implementResult.success,
            result: implementResult,
            files: implementResult.files
          };
          
        case 'metrics':
          const metrics = lite.metrics.dashboard();
          return {
            type: 'lite',
            action: 'metrics',
            success: true,
            metrics
          };
          
        case 'figma':
          // Handle Figma integration
          const figmaUrl = args[0];
          if (!figmaUrl) {
            logger.warn('Figma URL required for lite figma command');
            return {
              type: 'lite',
              action: 'figma',
              success: false,
              error: 'Figma URL required'
            };
          }
          
          const figmaResult = await lite.fromFigma(figmaUrl)
            .generateUI()
            .generateAPI()
            .deploy();
            
          return {
            type: 'lite',
            action: 'figma',
            success: figmaResult.success,
            result: figmaResult
          };
          
        case 'executive':
          // Executive coordination mode
          const tasks = args.length > 0 ? args : ['design', 'build', 'deploy'];
          const executive = lite.executive();
          const coordResult = await executive.coordinate(tasks);
          await executive.deliver();
          
          return {
            type: 'lite',
            action: 'executive',
            success: true,
            results: coordResult
          };
          
        case 'help':
          logger.info(chalk.cyan('\n🏁 BUMBA Lite Mode - Ultra-Minimal Framework\n'));
          logger.info('Available commands:');
          logger.info('  /bumba:lite [prompt]         - Develop with auto-detection');
          logger.info('  /bumba:lite-analyze [target] - Analyze code or requirements');
          logger.info('  /bumba:lite-implement [task] - Implement a feature');
          logger.info('  /bumba:lite figma [url]      - Generate from Figma');
          logger.info('  /bumba:lite executive        - CEO coordination mode');
          logger.info('  /bumba:lite metrics          - Show metrics dashboard');
          logger.info('  /bumba:lite help             - Show this help\n');
          logger.info(chalk.gray('Performance: <1MB memory, <100ms startup'));
          
          return {
            type: 'lite',
            action: 'help',
            success: true
          };
          
        default:
          // Default development mode with auto-detection
          const prompt = args.join(' ') || 'create something amazing';
          const result = await lite.develop(prompt);
          
          // Show generated files if any
          if (result.files) {
            logger.info(chalk.green('\n📁 Generated files:'));
            Object.keys(result.files).forEach(file => {
              logger.info(chalk.gray(`  • ${file}`));
            });
          }
          
          return {
            type: 'lite',
            action: 'develop',
            success: result.success,
            result
          };
      }
      
    } catch (error) {
      logger.error(`Lite mode error: ${error.message}`);
      return {
        type: 'lite',
        success: false,
        error: error.message
      };
    }
  }

  async handleSystemCommand(args, context) {
    logger.info('🟢 Executing System command');
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleSystemCommand(args, context);
  }

  async handleDevOpsCommand(args, context) {
    logger.info('🟢 Executing DevOps command');

    try {
      // Lazy load DevOps handler
      const DevOpsHandler = require('./command-handlers/devops-handler');
      const handler = new DevOpsHandler();

      // Parse DevOps operation from args
      const operation = args.operation || args._[0] || 'help';
      const params = { ...args };
      delete params.operation;
      delete params._;

      // Execute DevOps operation
      const result = await handler.handle(operation, params);

      return {
        type: 'devops',
        operation,
        result,
        success: result.success
      };
    } catch (error) {
      logger.error(`DevOps command failed: ${error.message}`);
      return {
        type: 'devops',
        error: error.message,
        success: false
      };
    }
  }

  async handleMonitoringCommand(args, context) {
    logger.info('🟢 Executing Monitoring command');
    
    // Use actual implementation
    const { getInstance } = require('./command-implementations');
    const implementations = getInstance();
    return await implementations.handleMonitoringCommand(args, context);
  }

  async handleConnectCommand(args, context) {
    logger.info('🟢 Executing Connect command - Interactive integration setup');
    
    try {
      // Lazy load the connection wizard
      const ConnectionWizard = require('./integration/connection-wizard');
      const wizard = new ConnectionWizard();
      
      // Extract specific integration from args if provided
      const integration = args._?.[0] || args.integration || null;
      
      // Run the connection wizard
      const result = await wizard.run(integration);
      
      // Show updated operability score
      const { getInstance: getOperabilityTracker } = require('./integration/operability-tracker');
      const tracker = getOperabilityTracker();
      const report = tracker.getStatusReport();
      
      logger.info(`🟡 Current Operability: ${report.operabilityScore}%`);
      
      return {
        type: 'connect',
        success: result.success,
        connected: result.connected,
        operabilityScore: report.operabilityScore,
        achievement: report.achievement
      };
    } catch (error) {
      logger.error(`Connect command failed: ${error.message}`);
      return {
        type: 'connect',
        success: false,
        error: error.message
      };
    }
  }

  async handleOperabilityCommand(args, context) {
    logger.info('🟢 Executing Operability command - Integration status dashboard');
    
    try {
      // Get the dashboard instance
      const { getInstance: getDashboard } = require('./unified-monitoring-system');
      const dashboard = getDashboard();
      
      // Get the tracker instance
      const { getInstance: getTracker } = require('./integration/operability-tracker');
      const tracker = getTracker();
      
      // Parse action from args
      const action = args._?.[0] || args.action || 'display';
      
      switch (action) {
        case 'status':
          // Show quick status
          const miniStatus = dashboard.displayMini();
          logger.info(miniStatus);
          break;
          
        case 'quiet':
          // Toggle quiet mode
          const currentMode = tracker.quietMode;
          tracker.setQuietMode(!currentMode);
          logger.info(currentMode ? '🔔 Quiet mode disabled' : '🔇 Quiet mode enabled');
          break;
          
        case 'reset':
          // Reset tracking data
          tracker.reset();
          logger.info('🟢️ Operability tracking reset');
          break;
          
        case 'display':
        default:
          // Show full dashboard
          dashboard.display();
          break;
      }
      
      const report = tracker.getStatusReport();
      
      return {
        type: 'operability',
        action,
        operabilityScore: report.operabilityScore,
        achievement: report.achievement,
        quietMode: tracker.quietMode,
        success: true
      };
    } catch (error) {
      logger.error(`Operability command failed: ${error.message}`);
      return {
        type: 'operability',
        success: false,
        error: error.message
      };
    }
  }

  async routeToDepartment(command, args, context) {
    // Intelligent routing based on command pattern
    if (command.includes('design') || command.includes('ui')) {
      return this.handleDesignCommand(args, context);
    }
    if (command.includes('api') || command.includes('backend')) {
      return this.handleBackendCommand(args, context);
    }
    if (command.includes('product') || command.includes('strategy')) {
      return this.handleProductCommand(args, context);
    }

    // Default to global handling
    return this.handleGlobalCommand(args, context);
  }

  /**
   * ENHANCED: Initialize testing framework
   */
  initializeTestingFramework(testingFramework) {
    this.testingFramework = testingFramework;
    logger.info('🟢 Testing framework connected to command handler');
  }

  /**
   * ENHANCED: Run testing on command results
   */
  async runCommandTesting(result, originalGoal) {
    if (!this.testingFramework) {
      return {
        passed: true,
        coverage: 100,
        failures: [],
        skipped: true,
        reason: 'Testing framework not initialized'
      };
    }

    // Run checkpoint testing
    const testReport = await this.testingFramework.testAtCheckpoint([result], originalGoal);

    // Also run completeness validation
    const completeness = await this.testingFramework.validateCompleteness(result, originalGoal);

    // Combine reports
    testReport.completeness = completeness;

    if (!completeness.complete) {
      testReport.passed = false;
      testReport.failures.push(...completeness.missingElements);
    }

    return testReport;
  }

  /**
   * ENHANCED: Enable/disable testing
   */
  setTestingEnabled(enabled) {
    this.testingEnabled = enabled;
    logger.info(`🟢 Testing ${enabled ? 'enabled' : 'disabled'} for command handler`);
  }

  /**
   * Map command to department
   */
  mapCommandToDepartment(command) {
    return this.identifyDepartment(command);
  }

  /**
   * Get command priority for orchestration
   */
  getCommandPriority(command) {
    const highPriority = ['secure', 'scan', 'deploy', 'fix', 'hotfix'];
    const mediumPriority = ['implement', 'analyze', 'test', 'validate'];

    if (highPriority.some(cmd => command.includes(cmd))) {return 'High';}
    if (mediumPriority.some(cmd => command.includes(cmd))) {return 'Medium';}
    return 'Low';
  }

  /**
   * Identify department for command
   */
  identifyDepartment(command) {
    if (command.includes('design') || command.includes('ui') || command.includes('figma')) {
      return 'design-engineer';
    }
    if (command.includes('api') || command.includes('backend') || command.includes('secure')) {
      return 'backend-engineer';
    }
    if (command.includes('product') || command.includes('strategy') || command.includes('prd')) {
      return 'product-strategist';
    }
    return 'general';
  }

  /**
   * Get or initialize command router
   */
  getCommandRouter() {
    if (!this.commandRouter) {
      try {
        const { getInstance } = require('./command-router-integration');
        this.commandRouter = getInstance();
        logger.info('🏁 Command router initialized for intelligent routing');
      } catch (error) {
        logger.warn('🟡 Command router not available:', error.message);
      }
    }
    return this.commandRouter;
  }
  
  /**
   * Connect to orchestration system (called by framework)
   */
  connectToOrchestration() {
    try {
      const { BumbaOrchestrationSystem } = require('./orchestration');
      const orchestration = new BumbaOrchestrationSystem({
        enableQualityChecks: true,
        enableMilestones: true
      });

      this.initializeOrchestration(orchestration);
      return true;
    } catch (error) {
      logger.warn('Could not connect to orchestration system:', error.message);
      return false;
    }
  }

  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }

  hasCommand(command) {
    return this.handlers.has(command);
  }

  setHooks(hooks) {
    this.hooks = hooks;
  }

  /**
   * Get orchestration status
   */
  getOrchestrationStatus() {
    return {
      enabled: this.orchestrationEnabled,
      connected: this.orchestrationConnected,
      hasTaskOrchestrator: !!this.taskOrchestrator,
      hasNotionClient: !!this.notionClient,
      registeredCommands: this.handlers.size
    };
  }
}

// Export both class and singleton instance following standard pattern
module.exports = {
  CommandHandler: BumbaCommandHandler,
  BumbaCommandHandler,  // Keep for backward compatibility
  commandHandler: new BumbaCommandHandler()  // Singleton instance
};
