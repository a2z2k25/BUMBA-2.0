#!/usr/bin/env node

// BUMBA Interactive Command Menu
// Smart command discovery with contextual suggestions

const fs = require('fs');
const { logger } = require('../core/logging/bumba-logger');

const path = require('path');
const chalk = require('chalk');

class BumbaCommandMenu {
  constructor() {
    this.commands = this.loadCommands();
    this.userContext = this.detectUserContext();
  }

  loadCommands() {
    return {
      'Strategy & Planning': [
        {
          cmd: '/bumba:prd',
          desc: 'Create Product Requirements Document',
          complexity: 'Medium',
          time: '10-15 min'
        },
        {
          cmd: '/bumba:requirements',
          desc: 'Discover and gather requirements',
          complexity: 'Easy',
          time: '5-10 min'
        },
        {
          cmd: '/bumba:roadmap',
          desc: 'Create development roadmap',
          complexity: 'Medium',
          time: '15-20 min'
        }
      ],
      'Design & UI': [
        {
          cmd: '/bumba:figma',
          desc: 'Figma Dev Mode integration',
          complexity: 'Easy',
          time: '2-5 min'
        },
        {
          cmd: '/bumba:design',
          desc: 'Design-to-code workflows',
          complexity: 'Medium',
          time: '5-15 min'
        },
        { cmd: '/bumba:ui', desc: 'Generate UI components', complexity: 'Easy', time: '3-8 min' }
      ],
      Development: [
        {
          cmd: '/bumba:implement',
          desc: 'Intelligent feature development',
          complexity: 'Medium',
          time: '10-30 min'
        },
        {
          cmd: '/bumba:analyze',
          desc: 'Comprehensive code analysis',
          complexity: 'Easy',
          time: '2-5 min'
        },
        {
          cmd: '/bumba:secure',
          desc: 'Security validation & fixes',
          complexity: 'Medium',
          time: '5-15 min'
        }
      ],
      'System & Help': [
        {
          cmd: '/bumba:memory',
          desc: 'Advanced context management',
          complexity: 'Easy',
          time: '1-3 min'
        },
        { cmd: '/bumba:help', desc: 'Contextual assistance', complexity: 'Easy', time: '1-2 min' },
        {
          cmd: '/bumba:settings',
          desc: 'Framework configuration',
          complexity: 'Easy',
          time: '2-5 min'
        }
      ]
    };
  }

  detectUserContext() {
    const context = { type: 'general', suggestions: [] };

    try {
      // Check current directory for project type
      if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (pkg.dependencies?.react || pkg.dependencies?.next) {
          context.type = 'react';
          context.suggestions.push('/bumba:ui - Generate React components');
        }
        if (pkg.dependencies?.figma) {
          context.suggestions.push('/bumba:figma - Figma integration available');
        }
      }

      if (fs.existsSync('.git')) {
        context.suggestions.push('/bumba:analyze - Code quality check');
      }

      // Check for design files
      const designFiles = fs
        .readdirSync('.')
        .filter(f => f.endsWith('.fig') || f.endsWith('.sketch') || f.includes('design'));
      if (designFiles.length > 0) {
        context.suggestions.push('/bumba:design - Convert designs to code');
      }
    } catch (error) {
      // Silent fail - context detection is optional
    }

    return context;
  }

  displayMenu() {
    console.clear();

    // Header
    logger.info(chalk.hex('#FFD700').bold('🏁🏁🏁🏁 BUMBA Command Menu 🏁🏁🏁🏁\n'));

    // Smart suggestions based on context
    if (this.userContext.suggestions.length > 0) {
      logger.info(chalk.cyan.bold('🏁 Smart Suggestions for Your Project:'));
      this.userContext.suggestions.forEach(suggestion => {
        logger.info(chalk.cyan(`   ${suggestion}`));
      });
      logger.info('');
    }

    // Command categories
    Object.entries(this.commands).forEach(([category, commands]) => {
      logger.info(chalk.white.bold(`${category}:`));

      commands.forEach(({ cmd, desc, complexity, time }) => {
        const complexityColor =
          {
            Easy: chalk.green,
            Medium: chalk.yellow,
            Hard: chalk.red
          }[complexity] || chalk.white;

        logger.info(`  ${chalk.white.bold(cmd.padEnd(20))} ${desc}`);
        logger.info(`    ${complexityColor(complexity)} • ${chalk.dim(time)}`);
      });
      logger.info('');
    });

    // Footer
    logger.info(chalk.dim('🏁 Pro tip: Commands adapt to your project context automatically'));
    logger.info(chalk.dim('🏁 Run /bumba:menu anytime to see updated suggestions\n'));
  }
}

// Export for use in main framework
module.exports = BumbaCommandMenu;

// CLI usage
if (require.main === module) {
  const menu = new BumbaCommandMenu();
  menu.displayMenu();
}
