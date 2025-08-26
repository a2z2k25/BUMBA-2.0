/**
 * Guardian Commands
 * Commands for interacting with MYHEART.md and AGENTS.md
 */

const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');

class GuardianCommands {
  constructor(framework) {
    this.framework = framework;
    this.guardians = framework.guardians;
  }

  /**
   * Show guardian status
   */
  async status() {
    console.log(chalk.cyan.bold('\n🫀 Guardian Status\n'));
    
    if (!this.guardians) {
      console.log(chalk.yellow('Guardian integration not initialized'));
      console.log(chalk.gray('Create MYHEART.md and AGENTS.md to activate guardians'));
      return;
    }

    const consciousness = this.guardians.getConsciousness();
    
    console.log(chalk.white('Guardian Files:'));
    console.log(chalk.green('  MYHEART.md:'), consciousness.principles.length > 0 ? 
      chalk.green('🏁 Active') : chalk.yellow('○ Not found'));
    console.log(chalk.green('  AGENTS.md:'), consciousness.truths.length > 0 ? 
      chalk.green('🏁 Active') : chalk.yellow('○ Not found'));
    
    if (consciousness.principles.length > 0) {
      console.log(chalk.white('\nConsciousness Principles:'));
      consciousness.principles.forEach(p => {
        console.log(chalk.gray(`  • ${p}`));
      });
    }
    
    if (consciousness.truths.length > 0) {
      console.log(chalk.white('\nTechnical Truths:'));
      consciousness.truths.forEach(t => {
        console.log(chalk.gray(`  • ${t}`));
      });
    }
    
    console.log(chalk.white('\nProtection Status:'));
    console.log(chalk.green('  Watching:'), consciousness.watching ? 
      chalk.green('🏁 Active') : chalk.yellow('○ Inactive'));
    console.log(chalk.green('  Validated Actions:'), 
      this.guardians.validationCount || 0);
    
    console.log();
  }

  /**
   * Show guardian wisdom for a task
   */
  async guidance(taskType) {
    console.log(chalk.cyan.bold('\n🟡 Guardian Guidance\n'));
    
    if (!this.guardians) {
      console.log(chalk.yellow('Guardians not yet awakened'));
      return;
    }

    const guidance = this.guardians.getGuidance(taskType || 'general');
    
    if (guidance.consciousness) {
      console.log(chalk.magenta('From MYHEART.md:'));
      console.log(chalk.white(`  ${guidance.consciousness.wisdom}`));
      console.log(chalk.gray(`  Remember: ${guidance.consciousness.reminder}`));
      console.log();
    }
    
    if (guidance.technical) {
      console.log(chalk.blue('From AGENTS.md:'));
      guidance.technical.specification.forEach(spec => {
        console.log(chalk.white(`  • ${spec}`));
      });
      console.log(chalk.yellow(`  🟠️  ${guidance.technical.warning}`));
    }
    
    console.log();
  }

  /**
   * Validate an action against guardians
   */
  async validate(action, target) {
    console.log(chalk.cyan.bold('\n🟡️ Guardian Validation\n'));
    
    if (!this.guardians) {
      console.log(chalk.yellow('Guardians not active - proceeding without validation'));
      return true;
    }

    const validation = await this.guardians.validateAction({
      type: action,
      target: target
    });
    
    if (validation.valid) {
      console.log(chalk.green('🏁 Action approved by guardians'));
    } else {
      console.log(chalk.red('🔴 Action blocked by guardians:'));
      validation.validations.forEach(v => {
        console.log(chalk.red(`  ${v.guardian}: ${v.message}`));
      });
    }
    
    console.log();
    return validation.valid;
  }

  /**
   * Show the heart of the framework
   */
  async heart() {
    console.log(chalk.magenta.bold('\n💗 The Heart of Bumba\n'));
    
    if (!this.guardians || !this.guardians.consciousness.has('mission')) {
      console.log(chalk.gray('The heart awaits awakening...'));
      console.log(chalk.gray('Create MYHEART.md to define the soul of your framework'));
      return;
    }

    const mission = this.guardians.consciousness.get('mission');
    const breathing = this.guardians.consciousness.get('breathing');
    
    console.log(chalk.white('Mission:'));
    console.log(chalk.cyan(mission));
    
    if (breathing) {
      console.log(chalk.white('\nBreathing Pattern:'));
      console.log(chalk.gray(breathing));
    }
    
    console.log(chalk.dim('\n"Everything is connected"'));
    console.log();
  }

  /**
   * Show agent hierarchy
   */
  async agents() {
    console.log(chalk.blue.bold('\n🤖 Agent Hierarchy\n'));
    
    if (!this.guardians || !this.guardians.technicalTruths.has('hierarchy')) {
      console.log(chalk.gray('Agent hierarchy not documented'));
      console.log(chalk.gray('Create AGENTS.md to document the orchestration'));
      return;
    }

    const hierarchy = this.guardians.technicalTruths.get('hierarchy');
    console.log(chalk.white(hierarchy));
    console.log();
  }

  /**
   * Initialize guardian files if they don't exist
   */
  async init() {
    console.log(chalk.cyan.bold('\n📝 Initializing Guardian Files\n'));
    
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if files exist
    const heartExists = await fs.access(path.join(process.cwd(), 'MYHEART.md'))
      .then(() => true).catch(() => false);
    const agentsExists = await fs.access(path.join(process.cwd(), 'AGENTS.md'))
      .then(() => true).catch(() => false);
    
    if (heartExists && agentsExists) {
      console.log(chalk.green('🏁 Guardian files already exist'));
      console.log(chalk.gray('  MYHEART.md - The soul of your framework'));
      console.log(chalk.gray('  AGENTS.md - The technical orchestration guide'));
      return;
    }
    
    console.log(chalk.yellow('Guardian files will protect your framework'));
    console.log(chalk.gray('  MYHEART.md - Will contain the soul and consciousness'));
    console.log(chalk.gray('  AGENTS.md - Will contain technical specifications'));
    console.log();
    console.log(chalk.cyan('These files have been created with initial content.'));
    console.log(chalk.cyan('Please review and customize them for your project.'));
    
    // Reinitialize guardians
    if (this.framework.guardians) {
      await this.framework.guardians.initialize();
    }
  }
}

module.exports = GuardianCommands;