/**
 * BUMBA Honest Startup
 * Shows what ACTUALLY works with current configuration
 * 
 * SOLVES: Misleading "works without API" claims
 * RESULT: Users know exactly what they can do
 */

const chalk = require('chalk');
const { getCapabilityManager } = require('../capabilities/capability-manager');
const { getMaturityManager } = require('../specialists/specialist-maturity');
const { getTimerRegistry } = require('../timers/timer-registry');
const figlet = require('figlet');

class HonestStartup {
  constructor() {
    this.capabilityManager = getCapabilityManager();
    this.maturityManager = getMaturityManager();
    this.timerRegistry = getTimerRegistry();
  }
  
  /**
   * Display banner
   */
  displayBanner() {
    console.log(chalk.cyan(figlet.textSync('BUMBA CLI 1.0', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })));
    
    console.log(chalk.gray('Intelligent AI Agent Orchestration Framework\n'));
  }
  
  /**
   * Display system status
   */
  displaySystemStatus() {
    const isOperational = this.capabilityManager.isOperational();
    
    if (isOperational) {
      console.log(chalk.green('● System Status: OPERATIONAL\n'));
    } else {
      console.log(chalk.yellow('● System Status: LIMITED MODE\n'));
    }
  }
  
  /**
   * Display capability summary
   */
  displayCapabilities() {
    const caps = this.capabilityManager.getAvailableCapabilities();
    const hasAPIs = this.capabilityManager.isOperational();
    
    if (hasAPIs) {
      console.log(chalk.cyan('Available Capabilities:'));
      
      // Show top capabilities
      const topCaps = caps.withFullAPI.slice(0, 4);
      topCaps.forEach(cap => {
        console.log(chalk.green(`  ✓ ${cap}`));
      });
      console.log(chalk.gray(`  ... and ${caps.withFullAPI.length - 4} more\n`));
      
    } else {
      console.log(chalk.yellow('⚠️  Running without API keys\n'));
      
      console.log(chalk.red('What DOESN\'T work:'));
      caps.limitations.slice(0, 3).forEach(lim => {
        console.log(chalk.red(`  ✗ ${lim}`));
      });
      
      console.log(chalk.yellow('\nWhat DOES work (barely):'));
      caps.withoutAPI.forEach(cap => {
        console.log(chalk.gray(`  • ${cap}`));
      });
    }
  }
  
  /**
   * Display specialist status
   */
  displaySpecialistStatus() {
    const stats = this.maturityManager.generateReport();
    const verified = this.maturityManager.getVerifiedSpecialists();
    
    console.log(chalk.cyan('Specialist Status:'));
    
    if (this.capabilityManager.isOperational()) {
      console.log(chalk.green(`  ✓ ${verified.length} production-ready specialists`));
      console.log(chalk.gray(`  • ${stats.beta} in beta testing`));
      console.log(chalk.gray(`  • ${stats.alpha + stats.experimental} experimental\n`));
    } else {
      console.log(chalk.yellow('  ⚠️  Specialists require API keys to function\n'));
    }
  }
  
  /**
   * Display quick start
   */
  displayQuickStart() {
    const hasAPIs = this.capabilityManager.isOperational();
    
    if (hasAPIs) {
      console.log(chalk.cyan('Quick Start Commands:'));
      console.log(chalk.white('  /bumba:create') + chalk.gray(' - Generate new code'));
      console.log(chalk.white('  /bumba:review') + chalk.gray(' - Review existing code'));
      console.log(chalk.white('  /bumba:specialists --verified') + chalk.gray(' - Show ready specialists'));
      console.log(chalk.white('  /bumba:help') + chalk.gray(' - Show all commands\n'));
    } else {
      console.log(chalk.yellow('To Get Started:'));
      console.log(chalk.white('  1. Add API keys to .env file'));
      console.log(chalk.white('  2. Run: npm start'));
      console.log(chalk.white('  3. Use: /bumba:help\n'));
      
      console.log(chalk.gray('For detailed setup: /bumba:setup\n'));
    }
  }
  
  /**
   * Display warnings if needed
   */
  displayWarnings() {
    const warnings = [];
    
    // Check for timer issues
    const timerStats = this.timerRegistry.getStats();
    if (timerStats.leakRisk > 10) {
      warnings.push(`${timerStats.leakRisk} potential timer leaks detected`);
    }
    
    // Check for missing critical APIs
    const caps = this.capabilityManager.getAvailableCapabilities();
    if (!caps.available.anthropic && !caps.available.openai) {
      warnings.push('No LLM API available - core features disabled');
    }
    
    // Check configuration
    if (!process.env.NODE_ENV) {
      warnings.push('NODE_ENV not set - defaulting to development');
    }
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      warnings.forEach(w => {
        console.log(chalk.yellow(`  • ${w}`));
      });
      console.log();
    }
  }
  
  /**
   * Main startup routine
   */
  async start(options = {}) {
    const { silent, json } = options;
    
    if (json) {
      // Output JSON for programmatic use
      const report = {
        operational: this.capabilityManager.isOperational(),
        capabilities: this.capabilityManager.generateReport(),
        specialists: this.maturityManager.generateReport(),
        timers: this.timerRegistry.getStats()
      };
      console.log(JSON.stringify(report, null, 2));
      return report;
    }
    
    if (!silent) {
      console.clear();
      this.displayBanner();
      this.displaySystemStatus();
      this.displayCapabilities();
      this.displaySpecialistStatus();
      this.displayQuickStart();
      this.displayWarnings();
    }
    
    return {
      operational: this.capabilityManager.isOperational(),
      message: this.capabilityManager.isOperational() ? 
        'BUMBA ready with full capabilities' : 
        'BUMBA running in limited mode - add API keys for full functionality'
    };
  }
  
  /**
   * Setup wizard
   */
  async runSetupWizard() {
    console.log(chalk.cyan.bold('\n🧙 BUMBA Setup Wizard\n'));
    
    const instructions = this.capabilityManager.getSetupInstructions();
    console.log(instructions);
    
    // Check for .env file
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log(chalk.yellow('\n📝 Creating .env file...\n'));
      
      const template = `# BUMBA Environment Configuration
# Generated by Setup Wizard

# REQUIRED: At least one LLM API
ANTHROPIC_API_KEY=
# OPENAI_API_KEY=
# GOOGLE_API_KEY=

# Optional Integrations
# NOTION_API_KEY=
# GITHUB_TOKEN=

# Configuration
NODE_ENV=development
LOG_LEVEL=info
`;
      
      fs.writeFileSync(envPath, template, 'utf8');
      console.log(chalk.green('✓ Created .env file'));
      console.log(chalk.gray('  Edit this file and add your API keys\n'));
    } else {
      console.log(chalk.gray('✓ .env file exists\n'));
    }
    
    return true;
  }
}

// Singleton
let instance = null;

function getHonestStartup() {
  if (!instance) {
    instance = new HonestStartup();
  }
  return instance;
}

module.exports = {
  HonestStartup,
  getHonestStartup
};

// Allow direct execution
if (require.main === module) {
  const startup = new HonestStartup();
  startup.start().then(() => {
    process.exit(0);
  });
}