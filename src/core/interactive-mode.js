/**
 * BUMBA CLI Interactive Mode
 * Handles CLI interaction and command processing
 */

const readline = require('readline');
const chalk = require('chalk');
const { logger } = require('./logging/bumba-logger');

class InteractiveMode {
  constructor(framework) {
    this.framework = framework;
    this.rl = null;
    this.running = false;
  }

  async start() {
    this.running = true;
    
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('bumba> '),
      completer: this.commandCompleter.bind(this)
    });

    // Handle line input
    this.rl.on('line', async (line) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      // Handle exit commands
      if (trimmed === 'exit' || trimmed === 'quit' || trimmed === '.exit') {
        await this.shutdown();
        return;
      }

      // Process BUMBA commands
      if (trimmed.startsWith('/bumba:')) {
        await this.processCommand(trimmed);
      } else if (trimmed === 'help' || trimmed === '?') {
        await this.showHelp();
      } else if (trimmed === 'menu') {
        await this.showMenu();
      } else if (trimmed === 'status') {
        await this.showStatus();
      } else {
        console.log(chalk.yellow('Unknown command. Type "help" or "/bumba:help" for available commands.'));
      }

      this.rl.prompt();
    });

    // Handle close event
    this.rl.on('close', async () => {
      await this.shutdown();
    });

    // Show initial prompt
    this.rl.prompt();
  }

  async processCommand(command) {
    try {
      // Extract command and arguments
      const parts = command.replace('/bumba:', '').split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      // Special handling for menu
      if (cmd === 'menu') {
        await this.showMenu();
        return;
      }

      // Special handling for help
      if (cmd === 'help') {
        await this.showHelp();
        return;
      }

      // Guardian commands
      if (cmd === 'heart' || cmd === 'guardians' || cmd === 'agents') {
        await this.handleGuardianCommand(cmd, args);
        return;
      }

      // Process through framework
      console.log(chalk.cyan(`🟢 Processing: ${command}`));
      const result = await this.framework.processCommand(cmd, args, {
        interactive: true,
        source: 'cli'
      });

      // Display result
      if (result.status === 'completed') {
        console.log(chalk.green('🏁 Command completed successfully'));
        if (result.result && typeof result.result === 'object') {
          console.log(JSON.stringify(result.result, null, 2));
        }
      } else if (result.status === 'error') {
        console.log(chalk.red(`🔴 Error: ${result.error}`));
      }

    } catch (error) {
      console.log(chalk.red(`🔴 Command failed: ${error.message}`));
      logger.error('Interactive command error:', error);
    }
  }

  async showHelp() {
    console.log(chalk.green.bold('\n🟢 BUMBA CLI Commands\n'));
    
    const commands = await this.framework.getAvailableCommands();
    
    console.log(chalk.yellow('Framework Commands:'));
    commands.framework_commands.forEach(cmd => {
      console.log(`  ${cmd}`);
    });
    
    console.log(chalk.yellow('\nStrategic Commands:'));
    commands.strategic_commands.slice(0, 3).forEach(cmd => {
      console.log(`  ${cmd}`);
    });
    
    console.log(chalk.yellow('\nTechnical Commands:'));
    commands.technical_commands.slice(0, 3).forEach(cmd => {
      console.log(`  ${cmd}`);
    });
    
    console.log(chalk.yellow('\nExperience Commands:'));
    commands.experience_commands.slice(0, 3).forEach(cmd => {
      console.log(`  ${cmd}`);
    });
    
    console.log(chalk.gray('\nType "/bumba:menu" for the full interactive menu'));
    console.log(chalk.gray('Type "exit" or "quit" to leave\n'));
  }

  async showMenu() {
    // Delegate to the framework's interactive menu
    const { showInteractiveMenu } = require('../utils/interactiveMenu');
    await showInteractiveMenu();
  }

  async showStatus() {
    const status = await this.framework.getFrameworkStatus();
    
    console.log(chalk.green.bold('\n🟢 BUMBA CLI Status\n'));
    console.log(`Version: ${status.version}`);
    console.log(`Architecture: ${status.architecture}`);
    console.log(`Consciousness: ${status.consciousness_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Orchestration: ${status.orchestration_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Active Specialists: ${status.active_specialists}`);
    
    console.log(chalk.yellow('\nDepartments:'));
    Object.entries(status.departments).forEach(([name, dept]) => {
      console.log(`  ${name}: ${dept.active_specialists} specialists active`);
    });
    
    console.log();
  }

  commandCompleter(line) {
    const completions = [
      '/bumba:menu',
      '/bumba:help',
      '/bumba:status',
      '/bumba:heart',
      '/bumba:guardians',
      '/bumba:agents',
      '/bumba:implement',
      '/bumba:analyze',
      '/bumba:secure',
      '/bumba:design',
      '/bumba:test',
      'help',
      'menu',
      'status',
      'heart',
      'guardians',
      'exit',
      'quit'
    ];
    
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  }

  async handleGuardianCommand(cmd, args) {
    try {
      const GuardianCommands = require('./commands/guardian-commands');
      const guardianCmd = new GuardianCommands(this.framework);
      
      switch(cmd) {
        case 'heart':
          await guardianCmd.heart();
          break;
        case 'guardians':
          await guardianCmd.status();
          break;
        case 'agents':
          await guardianCmd.agents();
          break;
      }
    } catch (error) {
      console.log(chalk.yellow('Guardian commands initializing...'));
    }
  }

  async shutdown() {
    if (!this.running) {return;}
    
    console.log(chalk.yellow('\n🟡 Shutting down BUMBA CLI...'));
    
    try {
      await this.framework.shutdown();
      console.log(chalk.green('🏁 BUMBA CLI shutdown complete'));
    } catch (error) {
      console.error(chalk.red('🔴 Shutdown error:'), error.message);
    }
    
    this.running = false;
    if (this.rl) {
      this.rl.close();
    }
    process.exit(0);
  }
}

// Export function to start interactive mode
async function startInteractiveMode(framework) {
  const interactive = new InteractiveMode(framework);
  await interactive.start();
}

module.exports = {
  InteractiveMode,
  startInteractiveMode
};