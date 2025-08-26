/**
 * BUMBA Operability Tracking System
 * Smart integration progress monitoring with achievement-based encouragement
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const chalk = require('chalk');

class OperabilityTracker extends EventEmitter {
  constructor() {
    super();
    
    // Integration categories with weights
    this.integrationCategories = {
      core_mcp: {
        weight: 0.3,
        servers: ['memory', 'filesystem', 'sequential-thinking'],
        required: true,
        description: 'Essential MCP servers for basic operation'
      },
      ai_models: {
        weight: 0.25,
        apis: ['anthropic', 'openai', 'google'],
        required: true,
        description: 'AI model APIs for agent intelligence'
      },
      productivity_mcp: {
        weight: 0.15,
        servers: ['notion', 'github', 'airtable'],
        required: false,
        description: 'Productivity and collaboration tools'
      },
      database_mcp: {
        weight: 0.1,
        servers: ['postgres', 'mongodb', 'supabase'],
        required: false,
        description: 'Database integrations'
      },
      design_mcp: {
        weight: 0.1,
        servers: ['figma-devmode', 'figma-context', 'magic-ui'],
        required: false,
        description: 'Design and UI tools'
      },
      quality_mcp: {
        weight: 0.1,
        servers: ['semgrep', 'ref', 'pieces', 'exa'],
        required: false,
        description: 'Code quality and documentation tools'
      }
    };
    
    // Tracking state
    this.connectedIntegrations = new Set();
    this.attemptedConnections = new Set();
    this.connectionFailures = new Map();
    
    // Messaging state
    this.lastReminderTime = Date.now();
    this.reminderInterval = 5 * 60 * 1000; // 5 minutes initially
    this.quietMode = false;
    this.operabilityScore = 0;
    
    // Achievement levels
    this.achievements = {
      0: { level: 'Initialization', color: 'red', emoji: '🔴' },
      20: { level: 'Getting Started', color: 'redBright', emoji: '🟠' },
      40: { level: 'Making Progress', color: 'yellow', emoji: '🟡' },
      60: { level: 'Well Connected', color: 'yellowBright', emoji: '🟢' },
      80: { level: 'Highly Operational', color: 'green', emoji: '🏁', quietMode: true },
      95: { level: 'Production Ready', color: 'greenBright', emoji: '🟢' },
      100: { level: 'Fully Operational', color: 'cyan', emoji: '🏁' }
    };
    
    // Message templates
    this.messages = {
      startup: [
        "🟡 Current operability: {score}% - {missing} integrations available to connect",
        "💡 Tip: Connect {suggestion} to unlock {feature}",
        "🔗 {score}% operational - run 'bumba connect' to add integrations"
      ],
      reminder: [
        "📊 You're at {score}% operability - {next} would boost you to ~{projected}%",
        "🔴 Level up! Connect {suggestion} to reach {nextLevel}",
        "🟢 Quick win: Adding {suggestion} takes just 2 minutes"
      ],
      achievement: [
        "🏁 Achievement unlocked: {level}! You're {score}% operational",
        "🏁 Milestone reached: {level} status achieved!",
        "🟡 Fantastic! You've reached {level} with {score}% operability"
      ],
      quiet: [
        "🟢 {score}% operational - looking good!",
        "🏁 Running at {score}% capacity",
        "👍 {score}% connected - nice work!"
      ]
    };
    
    this.initializeTracking();
  }
  
  /**
   * Initialize tracking system
   */
  initializeTracking() {
    // Start reminder system
    this.startReminderSystem();
    
    // Calculate initial score
    this.updateOperabilityScore();
    
    // Set up hooks for connection events
    this.setupConnectionHooks();
  }
  
  /**
   * Calculate current operability score
   */
  updateOperabilityScore() {
    let totalScore = 0;
    let totalPossible = 0;
    
    for (const [category, config] of Object.entries(this.integrationCategories)) {
      const items = config.servers || config.apis || [];
      const connected = items.filter(item => this.connectedIntegrations.has(item)).length;
      const categoryScore = (connected / items.length) * config.weight * 100;
      
      totalScore += categoryScore;
      totalPossible += config.weight * 100;
    }
    
    this.operabilityScore = Math.round((totalScore / totalPossible) * 100);
    
    // Check for achievement unlock
    this.checkAchievements();
    
    return this.operabilityScore;
  }
  
  /**
   * Register a successful connection
   */
  registerConnection(integration, type = 'mcp') {
    if (!this.connectedIntegrations.has(integration)) {
      this.connectedIntegrations.add(integration);
      this.attemptedConnections.add(integration);
      
      const oldScore = this.operabilityScore;
      this.updateOperabilityScore();
      
      logger.info(chalk.green(`🏁 Connected: ${integration} (${type})`));
      logger.info(chalk.cyan(`📈 Operability: ${oldScore}% → ${this.operabilityScore}%`));
      
      this.emit('connection-success', {
        integration,
        type,
        oldScore,
        newScore: this.operabilityScore
      });
      
      // Show achievement if reached new level
      if (this.getAchievementLevel(oldScore) !== this.getAchievementLevel(this.operabilityScore)) {
        this.showAchievementMessage();
      }
    }
  }
  
  /**
   * Register a failed connection attempt
   */
  registerFailure(integration, error) {
    this.attemptedConnections.add(integration);
    this.connectionFailures.set(integration, {
      error: error.message,
      timestamp: Date.now(),
      attempts: (this.connectionFailures.get(integration)?.attempts || 0) + 1
    });
    
    this.emit('connection-failure', { integration, error });
  }
  
  /**
   * Get achievement level for score
   */
  getAchievementLevel(score) {
    const levels = Object.keys(this.achievements)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const level of levels) {
      if (score >= level) {
        return this.achievements[level];
      }
    }
    
    return this.achievements[0];
  }
  
  /**
   * Check and update quiet mode based on score
   */
  checkAchievements() {
    const achievement = this.getAchievementLevel(this.operabilityScore);
    
    // Enable quiet mode at 80% or higher
    if (achievement.quietMode && !this.quietMode) {
      this.quietMode = true;
      this.reminderInterval = 30 * 60 * 1000; // 30 minutes in quiet mode
      logger.info(chalk.green('🔕 Entering quiet mode - you\'re doing great!'));
    } else if (!achievement.quietMode && this.quietMode && this.operabilityScore < 80) {
      this.quietMode = false;
      this.reminderInterval = 5 * 60 * 1000; // Back to 5 minutes
    }
  }
  
  /**
   * Get smart suggestion for next integration
   */
  getSmartSuggestion() {
    // Prioritize required categories first
    for (const [category, config] of Object.entries(this.integrationCategories)) {
      if (config.required) {
        const items = config.servers || config.apis || [];
        const unconnected = items.filter(item => !this.connectedIntegrations.has(item));
        
        if (unconnected.length > 0) {
          return {
            suggestion: unconnected[0],
            category,
            impact: Math.round(config.weight * 100 / items.length),
            reason: config.description
          };
        }
      }
    }
    
    // Then suggest highest impact optional
    let bestSuggestion = null;
    let bestImpact = 0;
    
    for (const [category, config] of Object.entries(this.integrationCategories)) {
      if (!config.required) {
        const items = config.servers || config.apis || [];
        const unconnected = items.filter(item => !this.connectedIntegrations.has(item));
        
        if (unconnected.length > 0) {
          const impact = config.weight * 100 / items.length;
          if (impact > bestImpact) {
            bestImpact = impact;
            bestSuggestion = {
              suggestion: unconnected[0],
              category,
              impact: Math.round(impact),
              reason: config.description
            };
          }
        }
      }
    }
    
    return bestSuggestion;
  }
  
  /**
   * Show progress message
   */
  showProgressMessage(type = 'reminder') {
    if (this.quietMode && type === 'reminder') {
      // In quiet mode, use shorter messages
      const messages = this.messages.quiet;
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      logger.info(chalk.green(
        message.replace('{score}', this.operabilityScore)
      ));
      return;
    }
    
    const messages = this.messages[type] || this.messages.reminder;
    const message = messages[Math.floor(Math.random() * messages.length)];
    const suggestion = this.getSmartSuggestion();
    const achievement = this.getAchievementLevel(this.operabilityScore);
    
    let formatted = message
      .replace('{score}', this.operabilityScore)
      .replace('{level}', achievement.level)
      .replace('{nextLevel}', this.getNextLevel()?.level || 'Full Operation');
    
    if (suggestion) {
      formatted = formatted
        .replace('{suggestion}', suggestion.suggestion)
        .replace('{projected}', Math.min(100, this.operabilityScore + suggestion.impact))
        .replace('{feature}', suggestion.reason)
        .replace('{next}', suggestion.suggestion);
    }
    
    const missingCount = this.getTotalMissing();
    formatted = formatted.replace('{missing}', missingCount);
    
    // Color based on achievement level
    const colorFunc = chalk[achievement.color] || chalk.white;
    logger.info(`${achievement.emoji} ${colorFunc(formatted)}`);
  }
  
  /**
   * Show achievement message
   */
  showAchievementMessage() {
    const achievement = this.getAchievementLevel(this.operabilityScore);
    const messages = this.messages.achievement;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    const formatted = message
      .replace('{score}', this.operabilityScore)
      .replace('{level}', achievement.level);
    
    logger.info(chalk.bold[achievement.color](`\n${achievement.emoji} ${formatted}\n`));
    
    // Special message for 100%
    if (this.operabilityScore === 100) {
      logger.info(chalk.cyan.bold('🏁 Congratulations! Your BUMBA Framework is FULLY OPERATIONAL! 🏁'));
      logger.info(chalk.cyan('All systems are go. You have achieved maximum integration.'));
      this.stopReminderSystem(); // Stop reminders at 100%
    }
  }
  
  /**
   * Get next achievement level
   */
  getNextLevel() {
    const levels = Object.keys(this.achievements)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (const level of levels) {
      if (this.operabilityScore < level) {
        return this.achievements[level];
      }
    }
    
    return null;
  }
  
  /**
   * Get total missing integrations
   */
  getTotalMissing() {
    let total = 0;
    
    for (const config of Object.values(this.integrationCategories)) {
      const items = config.servers || config.apis || [];
      total += items.filter(item => !this.connectedIntegrations.has(item)).length;
    }
    
    return total;
  }
  
  /**
   * Setup connection hooks
   */
  setupConnectionHooks() {
    // Hook into various connection events
    process.nextTick(() => {
      // Show initial status on startup
      this.showProgressMessage('startup');
    });
  }
  
  /**
   * Start reminder system
   */
  startReminderSystem() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
    }
    
    this.reminderTimer = setInterval(() => {
      if (this.operabilityScore < 100) {
        this.showProgressMessage('reminder');
      }
    }, this.reminderInterval);
  }
  
  /**
   * Stop reminder system
   */
  stopReminderSystem() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
  }
  
  /**
   * Get detailed status report
   */
  getStatusReport() {
    const report = {
      operabilityScore: this.operabilityScore,
      achievement: this.getAchievementLevel(this.operabilityScore),
      quietMode: this.quietMode,
      connected: {
        total: this.connectedIntegrations.size,
        list: Array.from(this.connectedIntegrations)
      },
      missing: {},
      suggestions: []
    };
    
    // Add missing by category
    for (const [category, config] of Object.entries(this.integrationCategories)) {
      const items = config.servers || config.apis || [];
      const missing = items.filter(item => !this.connectedIntegrations.has(item));
      
      if (missing.length > 0) {
        report.missing[category] = {
          items: missing,
          required: config.required,
          description: config.description
        };
        
        // Add to suggestions if high impact
        if (config.weight >= 0.15) {
          report.suggestions.push(...missing.slice(0, 2));
        }
      }
    }
    
    return report;
  }
  
  /**
   * Interactive connection wizard
   */
  async connectionWizard() {
    const inquirer = require('inquirer');
    const report = this.getStatusReport();
    
    console.log(chalk.cyan.bold('\n🔌 BUMBA Connection Wizard\n'));
    console.log(chalk.white(`Current Operability: ${report.achievement.emoji} ${report.operabilityScore}% - ${report.achievement.level}`));
    
    if (report.operabilityScore === 100) {
      console.log(chalk.green('\n🟡 You\'re fully connected! No additional integrations needed.\n'));
      return;
    }
    
    // Show categories with missing integrations
    const choices = [];
    for (const [category, info] of Object.entries(report.missing)) {
      const label = `${info.required ? '⭐' : '○'} ${category} (${info.items.length} available)`;
      choices.push({
        name: label,
        value: category,
        short: category
      });
    }
    
    choices.push(new inquirer.Separator());
    choices.push({ name: 'Exit wizard', value: 'exit' });
    
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Which category would you like to connect?',
        choices
      }
    ]);
    
    if (category === 'exit') {
      return;
    }
    
    // Show specific integrations in category
    const categoryInfo = report.missing[category];
    const { integration } = await inquirer.prompt([
      {
        type: 'list',
        name: 'integration',
        message: `Select ${category} integration to connect:`,
        choices: categoryInfo.items.map(item => ({
          name: `${item} ${this.getIntegrationStatus(item)}`,
          value: item
        }))
      }
    ]);
    
    // Provide connection instructions
    this.showConnectionInstructions(integration, category);
  }
  
  /**
   * Get integration status indicator
   */
  getIntegrationStatus(integration) {
    if (this.connectedIntegrations.has(integration)) {
      return chalk.green('🏁');
    }
    if (this.connectionFailures.has(integration)) {
      return chalk.red('🔴');
    }
    if (this.attemptedConnections.has(integration)) {
      return chalk.yellow('○');
    }
    return chalk.gray('·');
  }
  
  /**
   * Show connection instructions
   */
  showConnectionInstructions(integration, category) {
    console.log(chalk.cyan(`\n📋 Connecting ${integration}\n`));
    
    // Integration-specific instructions
    const instructions = {
      anthropic: '1. Get API key from https://console.anthropic.com/\n2. Add to .env: ANTHROPIC_API_KEY=your_key',
      openai: '1. Get API key from https://platform.openai.com/\n2. Add to .env: OPENAI_API_KEY=your_key',
      notion: '1. Install: npm install @modelcontextprotocol/server-notion\n2. Get integration token from Notion settings\n3. Configure in bumba.config.js',
      github: '1. Install: npm install @modelcontextprotocol/server-github\n2. Generate personal access token\n3. Add to .env: GITHUB_TOKEN=your_token'
    };
    
    console.log(instructions[integration] || `Configure ${integration} in your .env or bumba.config.js`);
    console.log(chalk.gray('\nAfter configuration, restart BUMBA to detect the connection.\n'));
  }
  
  /**
   * Reset tracking
   */
  reset() {
    this.connectedIntegrations.clear();
    this.operabilityScore = 0;
    this.quietMode = false;
    logger.info('🟢️ Operability tracking reset');
  }
  
  /**
   * Manually set quiet mode
   */
  setQuietMode(enabled) {
    this.quietMode = enabled;
    logger.info(enabled ? '🔇 Quiet mode enabled' : '🔔 Quiet mode disabled');
  }
  
  /**
   * Get total connected integrations
   */
  getTotalConnected() {
    return this.connectedIntegrations.size;
  }
  
  /**
   * Get category status breakdown
   */
  getCategoryStatus() {
    const status = {};
    
    for (const [cat, config] of Object.entries(this.integrationCategories)) {
      const items = config.servers || config.apis || [];
      const connected = items.filter(item => this.connectedIntegrations.has(item)).length;
      
      status[cat] = {
        connected,
        total: items.length,
        percentage: Math.round((connected / items.length) * 100),
        required: config.required
      };
    }
    
    return status;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  OperabilityTracker,
  getInstance: () => {
    if (!instance) {
      instance = new OperabilityTracker();
    }
    return instance;
  }
};