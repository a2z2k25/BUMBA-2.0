/**
 * BUMBA Connection Wizard
 * Interactive integration setup with achievement tracking
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { getInstance: getOperabilityTracker } = require('./operability-tracker');
const { logger } = require('../logging/bumba-logger');

class ConnectionWizard {
  constructor() {
    this.tracker = getOperabilityTracker();
    
    // Integration instructions
    this.instructions = {
      // Core MCP
      'memory': {
        name: 'Memory MCP Server',
        category: 'core_mcp',
        steps: [
          '1. Install: npm install -g @modelcontextprotocol/server-memory',
          '2. Add to Claude settings.json under mcpServers',
          '3. Restart Claude to detect the server'
        ],
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory']
        }
      },
      'filesystem': {
        name: 'Filesystem MCP Server',
        category: 'core_mcp',
        steps: [
          '1. Install: npm install -g @modelcontextprotocol/server-filesystem',
          '2. Add to Claude settings.json under mcpServers',
          '3. Configure allowed directories',
          '4. Restart Claude'
        ],
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir']
        }
      },
      
      // AI Models
      'anthropic': {
        name: 'Anthropic Claude API',
        category: 'ai_models',
        steps: [
          '1. Get API key from https://console.anthropic.com',
          '2. Set environment variable: export ANTHROPIC_API_KEY=your-key',
          '3. Install SDK: npm install @anthropic-ai/sdk'
        ],
        envVar: 'ANTHROPIC_API_KEY'
      },
      'openai': {
        name: 'OpenAI GPT-4 API',
        category: 'ai_models',
        steps: [
          '1. Get API key from https://platform.openai.com',
          '2. Set environment variable: export OPENAI_API_KEY=your-key',
          '3. Install SDK: npm install openai'
        ],
        envVar: 'OPENAI_API_KEY'
      },
      
      // Productivity MCP
      'notion': {
        name: 'Notion MCP Server',
        category: 'productivity_mcp',
        steps: [
          '1. Get integration token from https://www.notion.so/my-integrations',
          '2. Install: npm install -g @modelcontextprotocol/server-notion',
          '3. Set environment variable: export NOTION_API_KEY=your-token',
          '4. Add to Claude settings.json',
          '5. Restart Claude'
        ],
        envVar: 'NOTION_API_KEY',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-notion'],
          env: {
            NOTION_API_KEY: '${NOTION_API_KEY}'
          }
        }
      },
      'github': {
        name: 'GitHub MCP Server',
        category: 'productivity_mcp',
        steps: [
          '1. Create personal access token at https://github.com/settings/tokens',
          '2. Install: npm install -g @modelcontextprotocol/server-github',
          '3. Set environment variable: export GITHUB_TOKEN=your-token',
          '4. Add to Claude settings.json',
          '5. Restart Claude'
        ],
        envVar: 'GITHUB_TOKEN',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_TOKEN: '${GITHUB_TOKEN}'
          }
        }
      }
    };
  }
  
  /**
   * Run the connection wizard
   */
  async run(specificIntegration = null) {
    const oldScore = this.tracker.operabilityScore;
    
    if (specificIntegration) {
      // Connect specific integration
      return await this.connectIntegration(specificIntegration);
    }
    
    // Interactive mode - show current status and suggestions
    await this.showCurrentStatus();
    
    // Get smart suggestions
    const suggestion = this.tracker.getSmartSuggestion();
    
    if (!suggestion) {
      logger.info(chalk.green('🏁 All integrations are connected! 100% operational!'));
      return { success: true, connected: [], operabilityScore: 100 };
    }
    
    // Ask user what they want to connect
    const choices = await this.getIntegrationChoices();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: `🟡 Connect ${suggestion.suggestion} (+${suggestion.impact}% operability)`,
            value: 'suggested'
          },
          {
            name: '📋 Choose from available integrations',
            value: 'choose'
          },
          {
            name: '📊 Show detailed status',
            value: 'status'
          },
          {
            name: '🔴 Exit',
            value: 'exit'
          }
        ]
      }
    ]);
    
    switch (action) {
      case 'suggested':
        return await this.connectIntegration(suggestion.integration);
        
      case 'choose':
        const { integration } = await inquirer.prompt([
          {
            type: 'list',
            name: 'integration',
            message: 'Select integration to connect:',
            choices
          }
        ]);
        
        if (integration !== 'back') {
          return await this.connectIntegration(integration);
        }
        return await this.run();
        
      case 'status':
        const { getInstance: getDashboard } = require('../unified-monitoring-system');
        const dashboard = getDashboard();
        dashboard.display();
        return await this.run();
        
      case 'exit':
      default:
        return { success: true, connected: [], operabilityScore: this.tracker.operabilityScore };
    }
  }
  
  /**
   * Show current operability status
   */
  async showCurrentStatus() {
    const report = this.tracker.getStatusReport();
    const { achievement, operabilityScore } = report;
    
    console.log('\n' + chalk.bold.cyan('BUMBA Integration Status'));
    console.log(chalk.gray('━'.repeat(40)));
    
    // Show progress bar
    const progressBar = this.generateProgressBar(operabilityScore);
    console.log(`${achievement.emoji} Operability: ${progressBar} ${chalk.bold[achievement.color](operabilityScore + '%')}`);
    console.log(`Status: ${chalk[achievement.color](achievement.level)}`);
    
    if (operabilityScore < 100) {
      const missing = this.tracker.getTotalMissing();
      console.log(chalk.gray(`${missing} integrations available to connect`));
    }
    
    console.log('');
  }
  
  /**
   * Generate progress bar
   */
  generateProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    let color = chalk.red;
    if (percentage >= 80) color = chalk.green;
    else if (percentage >= 60) color = chalk.yellow;
    else if (percentage >= 40) color = chalk.yellowBright;
    else if (percentage >= 20) color = chalk.redBright;
    
    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }
  
  /**
   * Get available integration choices
   */
  async getIntegrationChoices() {
    const choices = [];
    const categories = {};
    
    // Group by category
    for (const [key, info] of Object.entries(this.instructions)) {
      if (!this.tracker.connectedIntegrations.has(key)) {
        const cat = info.category || 'other';
        if (!categories[cat]) {
          categories[cat] = [];
        }
        categories[cat].push({
          name: `${info.name}`,
          value: key
        });
      }
    }
    
    // Add category separators
    for (const [cat, items] of Object.entries(categories)) {
      if (items.length > 0) {
        choices.push(new inquirer.Separator(chalk.bold(`── ${cat.replace(/_/g, ' ').toUpperCase()} ──`)));
        choices.push(...items);
      }
    }
    
    choices.push(new inquirer.Separator());
    choices.push({ name: '← Back', value: 'back' });
    
    return choices;
  }
  
  /**
   * Connect a specific integration
   */
  async connectIntegration(integrationKey) {
    const info = this.instructions[integrationKey];
    
    if (!info) {
      logger.error(`Unknown integration: ${integrationKey}`);
      return { success: false, error: 'Unknown integration' };
    }
    
    console.log('\n' + chalk.bold.cyan(`Connecting ${info.name}`));
    console.log(chalk.gray('━'.repeat(40)));
    
    // Show instructions
    console.log(chalk.white('\nSetup Instructions:'));
    for (const step of info.steps) {
      console.log(chalk.gray('  ' + step));
    }
    
    // Check for environment variable if needed
    if (info.envVar) {
      const hasEnv = process.env[info.envVar];
      if (!hasEnv) {
        console.log(chalk.yellow(`\n🟠️  ${info.envVar} not set in environment`));
      } else {
        console.log(chalk.green(`\n🏁 ${info.envVar} is configured`));
      }
    }
    
    // Show config example if available
    if (info.config) {
      console.log(chalk.white('\nClaude settings.json configuration:'));
      console.log(chalk.gray(JSON.stringify({
        [integrationKey]: info.config
      }, null, 2)));
    }
    
    // Ask if user has completed setup
    const { completed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'completed',
        message: 'Have you completed the setup?',
        default: false
      }
    ]);
    
    if (completed) {
      // Mark as connected
      const oldScore = this.tracker.operabilityScore;
      this.tracker.addConnection(integrationKey);
      const newScore = this.tracker.operabilityScore;
      
      // Show achievement if unlocked
      if (Math.floor(newScore / 20) > Math.floor(oldScore / 20)) {
        const achievement = this.tracker.getAchievementLevel(newScore);
        console.log(chalk.bold.green(`\n🏁 Achievement Unlocked: ${achievement.level}!`));
      }
      
      console.log(chalk.green(`\n🏁 ${info.name} connected successfully!`));
      console.log(chalk.cyan(`Operability increased: ${oldScore}% → ${newScore}%`));
      
      // Ask if user wants to connect more
      const { continueConnecting } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueConnecting',
          message: 'Connect another integration?',
          default: newScore < 100
        }
      ]);
      
      if (continueConnecting) {
        return await this.run();
      }
      
      return {
        success: true,
        connected: [integrationKey],
        operabilityScore: newScore
      };
    }
    
    // User hasn't completed setup
    console.log(chalk.yellow('\nComplete the setup steps above and run this command again.'));
    
    return {
      success: false,
      connected: [],
      operabilityScore: this.tracker.operabilityScore
    };
  }
  
  /**
   * Test connection to an integration
   */
  async testConnection(integrationKey) {
    // This would ideally test actual connectivity
    // For now, we check environment variables and file existence
    const info = this.instructions[integrationKey];
    
    if (info.envVar) {
      return !!process.env[info.envVar];
    }
    
    // Could check for installed packages, config files, etc.
    return false;
  }
}

module.exports = ConnectionWizard;