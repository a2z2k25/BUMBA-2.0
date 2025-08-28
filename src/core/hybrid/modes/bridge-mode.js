/**
 * BUMBA Bridge Mode
 * Terminal-side task preparation and context gathering
 */

const BaseMode = require('./base-mode');
const ContextAnalyzer = require('../bridge/context-analyzer');
const TaskPreparer = require('../bridge/task-preparer');
const HandoffGenerator = require('../bridge/handoff-generator');
const chalk = require('chalk');

class BridgeMode extends BaseMode {
  constructor(options) {
    super(options);
    this.contextAnalyzer = new ContextAnalyzer();
    this.taskPreparer = new TaskPreparer();
    this.handoffGenerator = new HandoffGenerator();
    
    this.commands = [
      'prepare',
      'analyze',
      'context',
      'list',
      'status',
      'handoff'
    ];
  }

  /**
   * Check if command is available in bridge mode
   * @param {string} command Command name
   * @returns {boolean}
   */
  canExecute(command) {
    return this.commands.includes(command);
  }

  /**
   * Execute bridge mode command
   * @param {string} command Command name
   * @param {Array} args Command arguments
   * @returns {Promise}
   */
  async execute(command, ...args) {
    switch(command) {
      case 'prepare':
        return await this.prepareImplementation(args[0]);
        
      case 'analyze':
        return await this.analyzeProject();
        
      case 'context':
        return await this.gatherContext();
        
      case 'list':
        return await this.listPreparedTasks();
        
      case 'status':
        return this.showStatus();
        
      case 'handoff':
        return await this.generateHandoff(args[0]);
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Prepare an implementation task for Claude
   * @param {string} description Task description
   * @returns {Promise<Object>} Task details with handoff instructions
   */
  async prepareImplementation(description) {
    console.log('🏁 Preparing Implementation Task');
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
    
    // Gather context
    console.log('🟢 Gathering project context...');
    const context = await this.contextAnalyzer.analyzeProject();
    
    // Create task
    const task = {
      id: this.generateTaskId(),
      type: 'implementation',
      description,
      context,
      timestamp: Date.now(),
      requirements: this.taskPreparer.parseRequirements(description),
      suggestedAgents: this.taskPreparer.determineAgents(description)
    };
    
    // Save task
    await this.saveTask(task);
    
    // Generate handoff instructions
    const handoff = this.handoffGenerator.generate(task);
    
    console.log();
    console.log('🟢 Task prepared successfully!');
    console.log(`Task ID: ${task.id}`);
    console.log();
    console.log('📋 Context Gathered:');
    console.log(`  • Project Type: ${context.type}`);
    console.log(`  • Tech Stack: ${context.stack.join(', ')}`);
    console.log(`  • Files Analyzed: ${context.fileCount}`);
    console.log();
    console.log('🚀 To Execute in Claude:');
    console.log('1. Open Claude Code');
    console.log(`2. Navigate to: ${process.cwd()}`);
    console.log(`3. Run: /bumba:execute ${task.id}`);
    console.log();
    console.log(chalk.gray('━'.repeat(60)));
    console.log(`/bumba:execute ${task.id}`);
    console.log(chalk.gray('━'.repeat(60)));
    
    return { task, handoff };
  }

  /**
   * Analyze current project
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeProject() {
    console.log('🏁 Analyzing Project');
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
    
    const analysis = await this.contextAnalyzer.analyzeProject();
    
    console.log('📊 Analysis Results:');
    console.log();
    console.log(`Project Type: ${analysis.type}`);
    console.log(`Structure: ${analysis.structure.type}`);
    console.log();
    console.log('Tech Stack:');
    analysis.stack.forEach(tech => {
      console.log(`  • ${tech}`);
    });
    console.log();
    console.log('Patterns Detected:');
    analysis.patterns.forEach(pattern => {
      console.log(`  • ${pattern}`);
    });
    console.log();
    console.log(`Health Score: ${analysis.health.score}/100`);
    
    // Save context
    const contextId = await this.saveContext(analysis);
    console.log();
    console.log(`Context saved: ${contextId}`);
    
    return analysis;
  }

  /**
   * Gather comprehensive context
   * @returns {Promise<Object>} Context data
   */
  async gatherContext() {
    console.log('🏁 Gathering Context');
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
    
    const context = await this.contextAnalyzer.prepareForClaude();
    
    console.log('📋 Context Summary:');
    console.log(context.summary);
    console.log();
    console.log('📁 Relevant Files:');
    context.relevantFiles.slice(0, 10).forEach(file => {
      console.log(`  • ${file}`);
    });
    if (context.relevantFiles.length > 10) {
      console.log(`  ... and ${context.relevantFiles.length - 10} more`);
    }
    console.log();
    console.log('💡 Suggestions:');
    context.suggestions.forEach(suggestion => {
      console.log(`  • ${suggestion}`);
    });
    
    return context;
  }

  /**
   * List prepared tasks
   * @returns {Promise<Array>} Task list
   */
  async listPreparedTasks() {
    const tasks = await this.listTasks();
    
    console.log('🏁 Prepared Tasks');
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
    
    if (tasks.length === 0) {
      console.log('No tasks prepared yet.');
      console.log('Use "bumba prepare <description>" to create a task.');
    } else {
      tasks.forEach((task, index) => {
        const age = this.getTaskAge(task.createdAt);
        console.log(`${index + 1}. [${task.id}]`);
        console.log(`   Type: ${task.type}`);
        console.log(`   Description: ${task.description}`);
        console.log(`   Created: ${age}`);
        console.log(`   Status: ${task.status}`);
        console.log();
      });
      
      console.log(`Total: ${tasks.length} task(s)`);
      console.log();
      console.log('Execute in Claude with:');
      console.log(`/bumba:execute <task-id>`);
    }
    
    return tasks;
  }

  /**
   * Show bridge mode status
   */
  showStatus() {
    console.log('🏁 BUMBA Bridge Mode Status');
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
    console.log('Mode: BRIDGE (Terminal)');
    console.log('Purpose: Task preparation for Claude execution');
    console.log();
    console.log('Available Commands:');
    this.commands.forEach(cmd => {
      console.log(`  • bumba ${cmd}`);
    });
    console.log();
    console.log('Capabilities:');
    console.log('  🟢 Task Preparation');
    console.log('  🟢 Context Analysis');
    console.log('  🟢 Project Scanning');
    console.log('  🔴 AI Execution (requires Claude)');
    console.log('  🔴 Vision Analysis (requires Claude)');
    console.log();
    console.log('Next Step:');
    console.log('Prepare a task and execute it in Claude Code');
    
    return {
      mode: 'bridge',
      commands: this.commands,
      capabilities: this.environment.capabilities
    };
  }

  /**
   * Generate handoff instructions
   * @param {string} taskId Task ID
   * @returns {Promise<Object>} Handoff details
   */
  async generateHandoff(taskId) {
    if (!taskId) {
      const tasks = await this.listTasks();
      if (tasks.length === 0) {
        console.log('No tasks available for handoff');
        return null;
      }
      taskId = tasks[0].id;
    }
    
    const task = await this.loadTask(taskId);
    const handoff = this.handoffGenerator.generate(task);
    
    console.log(handoff.instruction);
    
    return handoff;
  }

  /**
   * Get human-readable task age
   * @param {number} timestamp Creation timestamp
   * @returns {string} Age string
   */
  getTaskAge(timestamp) {
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s) ago`;
    if (hours > 0) return `${hours} hour(s) ago`;
    if (minutes > 0) return `${minutes} minute(s) ago`;
    return 'Just now';
  }

  /**
   * Get mode information
   * @returns {Object}
   */
  getInfo() {
    return {
      name: 'Bridge Mode',
      type: 'Terminal Task Preparation',
      initialized: this.initialized,
      environment: this.environment.mode,
      purpose: 'Prepare tasks and context for Claude execution',
      commands: this.commands
    };
  }
}

module.exports = BridgeMode;