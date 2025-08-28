#!/usr/bin/env node

/**
 * BUMBA Post-Install Display (without exit)
 * Shows the installer view without terminating the process
 */

const chalk = require('chalk');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// BUMBA brand colors
const green = chalk.hex('#00AA00');
const yellow = chalk.hex('#FFDD00');
const orange = chalk.hex('#FFAA00');
const red = chalk.hex('#DD0000');
const gray = chalk.gray;

// Clear screen for full experience
console.clear();
console.log();

// Display BUMBA Logo with gradient
console.log(green('    ██████╗ ') + yellow('██╗   ██╗') + orange('███╗   ███╗') + red('██████╗  █████╗'));
console.log(green('    ██╔══██╗') + yellow('██║   ██║') + orange('████╗ ████║') + red('██╔══██╗██╔══██╗'));
console.log(green('    ██████╔╝') + yellow('██║   ██║') + orange('██╔████╔██║') + red('██████╔╝███████║'));
console.log(green('    ██╔══██╗') + yellow('██║   ██║') + orange('██║╚██╔╝██║') + red('██╔══██╗██╔══██║'));
console.log(green('    ██████╔╝') + yellow('╚██████╔╝') + orange('██║ ╚═╝ ██║') + red('██████╔╝██║  ██║'));
console.log(green('    ╚═════╝ ') + yellow(' ╚═════╝ ') + orange('╚═╝     ╚═╝') + red('╚═════╝ ╚═╝  ╚═╝'));
console.log();
console.log(gray('    CLAUDE CODE MASTERY FRAMEWORK'));
console.log(gray('    Professional • Intelligent • Secure'));
console.log(gray('    Designer-Optimized • Enterprise-Ready'));

// Version Box
console.log('\n\n');
console.log('┌──────────────────────────────────────────────┐');
console.log('│ 🏁 BUMBA FRAMEWORK INSTALLER 🏁              │');
console.log('│                                              │');
console.log('│ Version 3.0.3                                │');
console.log('│ ' + gray('By Professional Framework Team') + '               │');
console.log('└──────────────────────────────────────────────┘');
console.log();
console.log('🟢 BUMBA INSTALLATION COMPLETE 🟢');

// Feature Showcase
console.log('\n\n');
console.log('🏁 BUMBA Framework Capabilities 🏁');
console.log(gray('━'.repeat(60)));
console.log();

console.log('🟢 Multi-Agent Intelligence');
console.log('  • 3 Department Managers (Product, Design, Backend)');
console.log('  • 33 Specialized Agents with domain expertise');
console.log('  • Parallel execution for 3-5x faster development');
console.log('  • Smart task routing to best-fit specialists');
console.log();

console.log('🟡 58 Intelligent Commands');
console.log('  • Auto-routing with bumba implement');
console.log('  • Department-specific commands for precision');
console.log('  • Chain commands for complex workflows');
console.log('  • Consciousness-driven development mode');
console.log();

console.log('🔴 25+ Integrations');
console.log('  • MCP server ecosystem');
console.log('  • Notion for project management');
console.log('  • Figma for design-to-code');
console.log('  • GitHub for version control');
console.log();

console.log('🟠 Enterprise Quality');
console.log('  • Pre/post execution quality gates');
console.log('  • Security scanning and validation');
console.log('  • Performance monitoring (<1s response)');
console.log('  • 98% test coverage standards');
console.log();
console.log(gray('━'.repeat(60)));

// Why Choose BUMBA
console.log('\n');
console.log('🏁 Why Choose BUMBA?');
console.log(gray('━'.repeat(60)));
console.log();
console.log('Feature              Without BUMBA        With BUMBA');
console.log('─────────────────────────────────────────────────────');
console.log('Development Speed    Sequential tasks     🟢 3-5x faster');
console.log('Code Quality         Manual review        🏁 Automated gates');
console.log('AI Coordination      Single context       🟢 Multi-agent swarm');
console.log('Designer Tools       Basic support        🔴 Figma integration');
console.log('Project Management   Manual tracking      🟡 Notion sync');
console.log();

// Installation Summary
console.log(gray('━'.repeat(60)));
console.log();
console.log('🏁 INSTALLATION COMPLETE 🏁');
console.log();
console.log('🏁 INSTALLED   BUMBA Framework            Professional orchestration');
console.log('🏁 INSTALLED   58 Commands                Full command suite');
console.log('🏁 INSTALLED   Multi-Agent System         3 departments, 33 specialists');
console.log('🏁 INSTALLED   Quality Gates              Automated validation');
console.log();

// Quick Start
console.log(gray('━'.repeat(60)));
console.log();
console.log('🟢 Quick Start Commands:');
console.log();
console.log('  1. bumba menu');
console.log('     Explore all 58 commands');
console.log();
console.log('  2. bumba implement "your feature"');
console.log('     Build with AI agents');
console.log();
console.log('  3. bumba help');
console.log('     Get assistance');
console.log();

// Final celebration
console.log(gray('━'.repeat(60)));
console.log();
console.log('🏁 Welcome to BUMBA - Your AI Development Accelerator! 🏁');
console.log();

// Play the BUMBA horn sound if available
const playHorn = () => {
  // Try multiple methods to play sound
  const soundFile = path.join(__dirname, '..', 'assets', 'audio', 'bumba-horn.mp3');
  
  if (fs.existsSync(soundFile)) {
    // Try afplay on macOS
    if (process.platform === 'darwin') {
      exec(`afplay "${soundFile}" 2>/dev/null`, (error) => {
        if (error) {
          // Try using node-speaker or other methods
          exec(`open "${soundFile}" 2>/dev/null`);
        }
      });
    }
    // Try aplay on Linux
    else if (process.platform === 'linux') {
      exec(`aplay "${soundFile}" 2>/dev/null || mpg123 "${soundFile}" 2>/dev/null`, (error) => {
        // Silent fail - audio is nice but not critical
      });
    }
    // Try Windows
    else if (process.platform === 'win32') {
      exec(`start "${soundFile}" 2>nul`, (error) => {
        // Silent fail
      });
    }
  }
};

// Play celebration sound
playHorn();

// ASCII celebration (in case sound doesn't work)
console.log('        🎉 🎊 🎉');
console.log('     🏁  SUCCESS  🏁');
console.log('        🎉 🎊 🎉');
console.log();
console.log(gray('━'.repeat(60)));
console.log();

// DO NOT EXIT - let the main CLI continue