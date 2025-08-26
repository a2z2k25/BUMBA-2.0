/**
 * BUMBA Integration Status Dashboard
 * Visual dashboard showing integration health and setup status
 * Helps users understand what's working and what needs configuration
 */

const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');
const activationManager = require('./integration-activation-manager');
const autoSwitcher = require('./integration-auto-switcher');

class IntegrationStatusDashboard {
  constructor() {
    this.refreshInterval = null;
    this.displayMode = 'detailed'; // 'detailed', 'compact', 'minimal'
  }
  
  /**
   * Display the dashboard
   */
  async display(options = {}) {
    const status = activationManager.getStatus();
    const switcherStatus = autoSwitcher.getStatus();
    
    console.clear();
    this.displayHeader(status);
    
    if (options.mode || this.displayMode === 'detailed') {
      this.displayIntegrationTable(status, switcherStatus);
      this.displayFeatureTable(status);
      this.displayRecentSwitches(switcherStatus);
    } else if (this.displayMode === 'compact') {
      this.displayCompactStatus(status, switcherStatus);
    } else {
      this.displayMinimalStatus(status);
    }
    
    if (options.showGuide) {
      this.displaySetupGuide(status);
    }
    
    this.displayFooter(status);
  }
  
  /**
   * Display header
   */
  displayHeader(status) {
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║          BUMBA Integration Status Dashboard                 ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝\n'));
    
    // Mode indicator
    const modeColor = {
      production: chalk.green,
      hybrid: chalk.yellow,
      partial: chalk.yellow,
      development: chalk.red
    }[status.mode] || chalk.gray;
    
    console.log(chalk.bold('Operating Mode: ') + modeColor.bold(status.mode.toUpperCase()));
    console.log(chalk.bold('Integration Status: ') + 
                `${status.summary.active}/${status.summary.total} Active ` +
                chalk.gray(`(${status.summary.percentage}%)`));
    console.log('');
  }
  
  /**
   * Display integration table
   */
  displayIntegrationTable(status, switcherStatus) {
    // Custom table implementation
    const headers = ['Integration', 'Status', 'Provider', 'Features', 'Configuration'];
    const colWidths = [15, 12, 12, 25, 20];
    const rows = [];
    
    for (const [name, integration] of Object.entries(status.integrations)) {
      const providerInfo = switcherStatus.providers[name];
      
      // Status indicator
      const statusIcon = integration.status === 'live' ? '🟢' : 
                        integration.status === 'mock' ? '🟡' :
                        integration.status === 'error' ? '🔴' : '⚫';
      
      const statusText = integration.status === 'live' ? chalk.green('LIVE') :
                        integration.status === 'mock' ? chalk.yellow('MOCK') :
                        integration.status === 'error' ? chalk.red('ERROR') :
                        chalk.gray('UNKNOWN');
      
      // Provider type
      const providerType = providerInfo ? 
        (providerInfo.type === 'live' ? chalk.green('Live API') : chalk.yellow('Mock')) :
        chalk.gray('Not Loaded');
      
      // Features
      const features = integration.features ? 
        integration.features.slice(0, 2).join(', ') + 
        (integration.features.length > 2 ? '...' : '') :
        '-';
      
      // Configuration status
      const configStatus = this.getConfigStatus(name, integration);
      
      rows.push([
        `${statusIcon} ${chalk.bold(name)}`,
        statusText,
        providerType,
        chalk.gray(features),
        configStatus
      ]);
    }
    
    console.log(chalk.bold.underline('Integration Status:'));
    this.printTable(headers, rows, colWidths);
    console.log('');
  }
  
  /**
   * Get configuration status for an integration
   */
  getConfigStatus(name, integration) {
    const configs = {
      notion: {
        keys: ['NOTION_API_KEY'],
        docs: 'notion.so/my-integrations'
      },
      openai: {
        keys: ['OPENAI_API_KEY'],
        docs: 'platform.openai.com'
      },
      anthropic: {
        keys: ['ANTHROPIC_API_KEY'],
        docs: 'console.anthropic.com'
      },
      github: {
        keys: ['GITHUB_TOKEN'],
        docs: 'github.com/settings'
      },
      mcp: {
        keys: ['MCP_SERVER_PATH'],
        docs: 'github.com/mcp'
      },
      database: {
        keys: ['DATABASE_URL'],
        docs: 'Database Provider'
      }
    };
    
    const config = configs[name];
    if (!config) return chalk.gray('Unknown');
    
    const hasKeys = config.keys.every(key => !!process.env[key]);
    
    if (hasKeys && integration.status === 'live') {
      return chalk.green('🏁 Configured');
    } else if (hasKeys) {
      return chalk.yellow('🟠 Keys Present');
    } else {
      return chalk.red(`🔴 Missing Keys`);
    }
  }
  
  /**
   * Display feature availability table
   */
  displayFeatureTable(status) {
    // Custom table implementation
    const headers = ['Feature', 'Status', 'Requirements', 'Missing'];
    const colWidths = [25, 12, 30, 20];
    const rows = [];
    
    for (const [feature, featureStatus] of Object.entries(status.features)) {
      const statusIcon = featureStatus.available ? '🏁' : '🔴';
      const statusText = featureStatus.available ? 
        chalk.green('Available') : 
        chalk.red('Unavailable');
      
      const requirements = featureStatus.dependencies ? 
        featureStatus.dependencies.join(', ') : '-';
      
      const missing = featureStatus.missing && featureStatus.missing.length > 0 ?
        chalk.red(featureStatus.missing.join(', ')) :
        chalk.green('None');
      
      rows.push([
        `${statusIcon} ${feature}`,
        statusText,
        chalk.gray(requirements),
        missing
      ]);
    }
    
    console.log(chalk.bold.underline('Feature Availability:'));
    this.printTable(headers, rows, colWidths);
    console.log('');
  }
  
  /**
   * Display recent provider switches
   */
  displayRecentSwitches(switcherStatus) {
    if (!switcherStatus.switches || switcherStatus.switches.length === 0) {
      return;
    }
    
    console.log(chalk.bold.underline('Recent Provider Switches:'));
    
    // Custom table for switches
    const headers = ['Time', 'Integration', 'From → To', 'Status'];
    const colWidths = [15, 15, 20, 10];
    const rows = [];
    
    switcherStatus.switches.slice(-5).forEach(switchEvent => {
      const time = new Date(switchEvent.timestamp).toLocaleTimeString();
      const transition = `${switchEvent.from} → ${switchEvent.to}`;
      const status = switchEvent.success ? 
        chalk.green('🏁') : 
        chalk.red('🔴');
      
      rows.push([
        chalk.gray(time),
        switchEvent.integration,
        transition,
        status
      ]);
    });
    
    this.printTable(headers, rows, colWidths);
    console.log('');
  }
  
  /**
   * Display compact status
   */
  displayCompactStatus(status, switcherStatus) {
    // Integration summary
    console.log(chalk.bold.underline('Integrations:'));
    
    const integrationLine = Object.entries(status.integrations).map(([name, int]) => {
      const icon = int.status === 'live' ? '🟢' : 
                  int.status === 'mock' ? '🟡' : '🔴';
      return `${icon} ${name}`;
    }).join('  ');
    
    console.log(integrationLine);
    console.log('');
    
    // Feature summary
    console.log(chalk.bold.underline('Features:'));
    
    const featureLine = Object.entries(status.features).map(([name, feat]) => {
      const icon = feat.available ? '🏁' : '🔴';
      return `${icon} ${name}`;
    }).join('  ');
    
    console.log(featureLine);
    console.log('');
  }
  
  /**
   * Display minimal status
   */
  displayMinimalStatus(status) {
    const bar = this.createProgressBar(status.summary.percentage);
    console.log(`Integration Status: ${bar} ${status.summary.percentage}%`);
    console.log(`Mode: ${status.mode} | Active: ${status.summary.active}/${status.summary.total}`);
  }
  
  /**
   * Display setup guide
   */
  displaySetupGuide(status) {
    console.log(chalk.bold.underline('\n📚 Setup Guide:\n'));
    
    const missingIntegrations = Object.entries(status.integrations)
      .filter(([_, int]) => int.status !== 'live');
    
    if (missingIntegrations.length === 0) {
      console.log(chalk.green('🏁 All integrations are configured and active!'));
      return;
    }
    
    missingIntegrations.forEach(([name, integration]) => {
      console.log(chalk.yellow.bold(`\n${name.toUpperCase()}:`));
      
      const guide = this.getSetupGuide(name);
      guide.forEach(step => {
        console.log(`  ${step}`);
      });
    });
    
    console.log('');
  }
  
  /**
   * Get setup guide for an integration
   */
  getSetupGuide(name) {
    const guides = {
      notion: [
        '1. Go to https://www.notion.so/my-integrations',
        '2. Click "New integration"',
        '3. Copy the Internal Integration Token',
        '4. Add to .env: NOTION_API_KEY=secret_...',
        '5. Run: npm install @notionhq/client'
      ],
      openai: [
        '1. Go to https://platform.openai.com/api-keys',
        '2. Create a new API key',
        '3. Add to .env: OPENAI_API_KEY=sk-...',
        '4. Run: npm install openai'
      ],
      anthropic: [
        '1. Go to https://console.anthropic.com/settings/keys',
        '2. Create a new API key',
        '3. Add to .env: ANTHROPIC_API_KEY=sk-ant-...',
        '4. Run: npm install @anthropic-ai/sdk'
      ],
      github: [
        '1. Go to https://github.com/settings/tokens',
        '2. Generate new token (classic)',
        '3. Add to .env: GITHUB_TOKEN=ghp_...',
        '4. Run: npm install @octokit/rest'
      ],
      mcp: [
        '1. Install MCP server: npm install -g @modelcontextprotocol/server-memory',
        '2. Add to .env: MCP_SERVER_PATH=/path/to/server',
        '3. Run: npm install @modelcontextprotocol/sdk'
      ],
      database: [
        '1. Set up your database (PostgreSQL, MySQL, etc.)',
        '2. Add to .env: DATABASE_URL=postgresql://...',
        '3. Add to .env: DATABASE_TYPE=postgres',
        '4. Run: npm install typeorm pg'
      ]
    };
    
    return guides[name] || ['No setup guide available'];
  }
  
  /**
   * Display footer
   */
  displayFooter(status) {
    console.log(chalk.gray('─'.repeat(65)));
    
    // Quick actions
    console.log(chalk.bold('\n🟢 Quick Actions:'));
    console.log('  ' + chalk.cyan('bumba integrations check') + ' - Re-scan integrations');
    console.log('  ' + chalk.cyan('bumba integrations activate <name>') + ' - Activate integration');
    console.log('  ' + chalk.cyan('bumba integrations guide') + ' - Show setup guides');
    console.log('  ' + chalk.cyan('bumba integrations test') + ' - Test all integrations');
    
    // Tips based on mode
    if (status.mode === 'development') {
      console.log('\n' + chalk.yellow('💡 Tip: ') + 
                 'Add API keys to enable live integrations');
    } else if (status.mode === 'partial') {
      console.log('\n' + chalk.yellow('💡 Tip: ') + 
                 `Configure remaining ${status.summary.total - status.summary.active} integrations for full functionality`);
    } else if (status.mode === 'production') {
      console.log('\n' + chalk.green('🏁 All systems operational!'));
    }
    
    console.log('');
  }
  
  /**
   * Create a progress bar
   */
  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const filledChar = '█';
    const emptyChar = '░';
    
    const color = percentage >= 80 ? chalk.green :
                  percentage >= 50 ? chalk.yellow :
                  chalk.red;
    
    return color(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty));
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh(interval = 5000) {
    this.stopAutoRefresh();
    
    this.refreshInterval = setInterval(async () => {
      await this.display({ mode: 'compact' });
    }, interval);
    
    logger.info(`🔄 Auto-refresh started (${interval}ms interval)`);
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      logger.info('⏹️ Auto-refresh stopped');
    }
  }
  
  /**
   * Print a custom table without external dependencies
   */
  printTable(headers, rows, colWidths) {
    // Print headers
    const headerLine = headers.map((h, i) => {
      const width = colWidths ? colWidths[i] : 20;
      return chalk.white.bold(String(h).padEnd(width));
    }).join(' │ ');
    
    console.log(headerLine);
    console.log(chalk.gray('─'.repeat(headerLine.length - 20))); // Adjust for color codes
    
    // Print rows
    rows.forEach(row => {
      const rowLine = row.map((cell, i) => {
        const width = colWidths ? colWidths[i] : 20;
        return String(cell).padEnd(width);
      }).join(' │ ');
      console.log(rowLine);
    });
  }
  
  /**
   * Export status as JSON
   */
  async exportStatus() {
    const status = activationManager.getStatus();
    const switcherStatus = autoSwitcher.getStatus();
    
    return {
      timestamp: new Date().toISOString(),
      mode: status.mode,
      summary: status.summary,
      integrations: status.integrations,
      features: status.features,
      providers: switcherStatus.providers,
      recentSwitches: switcherStatus.switches
    };
  }
  
  /**
   * Run integration tests
   */
  async testIntegrations() {
    console.log(chalk.bold('\n🧪 Testing Integrations...\n'));
    
    const results = [];
    const status = activationManager.getStatus();
    
    for (const [name, integration] of Object.entries(status.integrations)) {
      process.stdout.write(`Testing ${name}... `);
      
      try {
        const provider = autoSwitcher.getProvider(name);
        
        if (!provider) {
          results.push({ name, success: false, error: 'Provider not loaded' });
          console.log(chalk.red('🔴 Provider not loaded'));
          continue;
        }
        
        // Run basic test based on integration type
        await this.testIntegration(name, provider);
        
        results.push({ name, success: true, type: provider.getType() });
        console.log(chalk.green(`🏁 ${provider.getType()}`));
        
      } catch (error) {
        results.push({ name, success: false, error: error.message });
        console.log(chalk.red(`🔴 ${error.message}`));
      }
    }
    
    // Summary
    console.log(chalk.bold('\n📊 Test Results:'));
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`  Passed: ${chalk.green(passed)}`);
    console.log(`  Failed: ${chalk.red(failed)}`);
    console.log(`  Total: ${results.length}`);
    
    return results;
  }
  
  /**
   * Test a specific integration
   */
  async testIntegration(name, provider) {
    switch (name) {
      case 'notion':
        // Test Notion by fetching user info
        if (provider.users?.me) {
          await provider.users.me();
        }
        break;
        
      case 'openai':
        // Test OpenAI with a simple completion
        if (provider.chat?.completions?.create) {
          await provider.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          });
        }
        break;
        
      case 'anthropic':
        // Test Anthropic with a simple message
        if (provider.messages?.create) {
          await provider.messages.create({
            model: 'claude-3-haiku-20240307',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          });
        }
        break;
        
      case 'github':
        // Test GitHub by fetching user info
        if (provider.users?.getAuthenticated) {
          await provider.users.getAuthenticated();
        }
        break;
        
      case 'mcp':
        // Test MCP by listing tools
        if (provider.tools?.list) {
          await provider.tools.list();
        }
        break;
        
      case 'database':
        // Test database connection
        // This would need actual database testing logic
        break;
        
      default:
        throw new Error('No test available');
    }
  }
}

// Export singleton instance
module.exports = new IntegrationStatusDashboard();