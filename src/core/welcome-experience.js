/**
 * BUMBA Welcome Experience
 * First-run user experience and command discovery
 */

const { logger } = require('./logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BumbaWelcomeExperience {
  constructor() {
    this.welcomeFile = path.join(os.homedir(), '.claude', '.bumba-welcome');
    this.firstRun = !fs.existsSync(this.welcomeFile);
  }

  /**
   * Show welcome experience for first-time users
   */
  async showWelcome() {
    if (this.firstRun) {
      await this.displayWelcomeMessage();
      await this.createWelcomeFile();
    }
    
    return this.firstRun;
  }

  /**
   * Display welcome message and quick start
   */
  async displayWelcomeMessage() {
    const welcomeMessage = `
🏁 Welcome to BUMBA Framework!

╭─────────────────────────────────────────╮
│         Production-Ready AI Platform    │
│      Multi-Agent Development System     │
╰─────────────────────────────────────────╯

🟢 Quick Start Commands:
  /bumba:menu       - Explore all 61 commands
  /bumba:implement  - Smart implementation
  /bumba:health     - System health check
  /bumba:help       - Get contextual help

🟢 Framework Overview:
  → 31 Specialists across 3 departments
  → 61 Commands for complete workflows
  → Production safety with parallel execution
  → MCP integration with 21+ servers

🟢 Essential Resources:
  → README.md - Complete framework guide
  → QUICK_START_GUIDE.md - 3-minute setup
  → docs/ - Comprehensive documentation

🟢 Pro Tips:
  • Start with /bumba:implement for auto-routing
  • Use /bumba:implement-agents for complex features  
  • Check /bumba:metrics for performance insights
  • Run /bumba:health before major operations

Ready to build? Try: /bumba:implement "your first feature"
`;

    console.log(welcomeMessage);
    logger.info('🏁 BUMBA Welcome Experience displayed');
  }

  /**
   * Create welcome file to track first run
   */
  async createWelcomeFile() {
    try {
      const welcomeData = {
        firstRunDate: new Date().toISOString(),
        version: '2.0.0',
        userAgent: process.env.USER || 'unknown',
        platform: os.platform(),
        nodeVersion: process.version
      };

      // Ensure .claude directory exists
      const claudeDir = path.dirname(this.welcomeFile);
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      fs.writeFileSync(this.welcomeFile, JSON.stringify(welcomeData, null, 2));
      logger.info('🏁 BUMBA welcome tracking initialized');
    } catch (error) {
      // Fail silently - welcome experience is not critical
      logger.warn('Could not create welcome file:', error.message);
    }
  }

  /**
   * Get user onboarding status
   */
  getOnboardingStatus() {
    if (!this.firstRun) {
      try {
        const welcomeData = JSON.parse(fs.readFileSync(this.welcomeFile, 'utf8'));
        return {
          firstRun: false,
          welcomeDate: welcomeData.firstRunDate,
          version: welcomeData.version,
          platform: welcomeData.platform
        };
      } catch (error) {
        return { firstRun: false, error: 'Could not read welcome data' };
      }
    }
    
    return { firstRun: true };
  }

  /**
   * Show command discovery helper
   */
  showCommandDiscovery() {
    const discoveryMessage = `
🟢 BUMBA Command Discovery

🟢 Command Categories:
┌─────────────────────────┬─────────────────────────┐
│ Category                │ Example Commands        │
├─────────────────────────┼─────────────────────────┤
│ 🟢 Product Strategy (8) │ prd, roadmap, research  │
│ 🟢 Design Engineer (9)  │ design, figma, ui       │
│ 🟢  Backend Engineer (9) │ api, secure, scan       │
│ 🟢 Collaboration (6)    │ team, collaborate       │
│ 🟢 Global (8)           │ implement, analyze      │
│ 🟢 Consciousness (4)    │ conscious-*, wisdom     │
│ 🟢 Lite Mode (3)        │ lite-*, fast execution  │
│ 🟢 Monitoring (6)       │ health, metrics, status │
│ 🟢  System (5)          │ menu, help, settings    │
└─────────────────────────┴─────────────────────────┘

🟢 Discovery Tips:
  • Use /bumba:menu for interactive exploration
  • Try /bumba:help [command] for specific guidance
  • Start with /bumba:implement for smart routing
  • Use /bumba:implement-agents for team coordination

🟢 Ready to explore? Start with /bumba:menu
`;

    console.log(discoveryMessage);
    return discoveryMessage;
  }

  /**
   * Show advanced features preview
   */
  showAdvancedFeatures() {
    return `
🟢 BUMBA Advanced Features

🟢 Consciousness-Driven Development:
  → Four Pillars: Knowledge, Purpose, Reason, Wisdom
  → Ethical validation for all implementations
  → Quality gates with consciousness checks

🟢 Production Safety Systems:
  → File locking prevents race conditions
  → Territory management for agent coordination
  → Safe operations with atomic transactions
  → Real-time monitoring and conflict resolution

🟢 Enterprise Monitoring:
  → Performance metrics with SLA tracking
  → Cost optimization and usage analytics
  → Health monitoring with auto-repair
  → Resource management and optimization

🟢 MCP Integration Ecosystem:
  → 21+ documented MCP servers
  → Automatic capability discovery
  → Context bridging and memory persistence
  → Tool awareness and intelligent routing

Ready to dive deeper? Explore the full documentation!
`;
  }

  /**
   * Reset welcome experience (for testing)
   */
  resetWelcome() {
    try {
      if (fs.existsSync(this.welcomeFile)) {
        fs.unlinkSync(this.welcomeFile);
        this.firstRun = true;
        logger.info('🏁 BUMBA welcome experience reset');
        return true;
      }
    } catch (error) {
      logger.warn('Could not reset welcome experience:', error.message);
    }
    return false;
  }
}

module.exports = { BumbaWelcomeExperience };