#!/usr/bin/env node

/**
 * BUMBA CLI Installer
 * Transform Claude into a full development team
 */

const { install } = require('./src/installer');
const chalk = require('chalk');

// BUMBA gradient colors
const green = chalk.hex('#52C41A');
const yellow = chalk.hex('#FAAD14');
const orange = chalk.hex('#FA8C16');
const red = chalk.hex('#F5222D');
const white = chalk.hex('#FFFFFF');
const gray = chalk.hex('#808080');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

// Check for help
if (args.includes('--help') || args.includes('-h')) {
  console.log('\n' + yellow('BUMBA CLI Installer'));
  console.log(gray('Transform Claude into a full development team\n'));
  console.log('Usage: node install.js [options]\n');
  console.log('Options:');
  console.log('  --quick             ' + gray('Quick install with smart defaults'));
  console.log('  --silent            ' + gray('Run without interactive prompts'));
  console.log('  --skip-onboarding   ' + gray('Skip the post-install tutorial'));
  console.log('  --help, -h          ' + gray('Show this help message\n'));
  process.exit(0);
}

// Set options
if (args.includes('--silent')) {
  options.silent = true;
  options.skipOnboarding = true;
  options.skipIntegrations = true;
}

if (args.includes('--quick')) {
  options.profile = 'quick';
  options.skipIntegrations = true;
}

if (args.includes('--skip-onboarding')) {
  options.skipOnboarding = true;
}

// Clear screen for impact
console.clear();

// Display BUMBA logo with gradient
console.log();
console.log(green('    ██████╗ ') + yellow('██╗   ██╗') + orange('███╗   ███╗') + red('██████╗  █████╗'));
console.log(green('    ██╔══██╗') + yellow('██║   ██║') + orange('████╗ ████║') + red('██╔══██╗██╔══██╗'));
console.log(green('    ██████╔╝') + yellow('██║   ██║') + orange('██╔████╔██║') + red('██████╔╝███████║'));
console.log(green('    ██╔══██╗') + yellow('██║   ██║') + orange('██║╚██╔╝██║') + red('██╔══██╗██╔══██║'));
console.log(green('    ██████╔╝') + yellow('╚██████╔╝') + orange('██║ ╚═╝ ██║') + red('██████╔╝██║  ██║'));
console.log(green('    ╚═════╝ ') + yellow(' ╚═════╝ ') + orange('╚═╝     ╚═╝') + red('╚═════╝ ╚═╝  ╚═╝'));
console.log();
console.log(gray('    Professional AI Orchestration Framework v2.0'));
console.log();

// Installation header
const line = '═'.repeat(52);
console.log(green(line.substring(0, 13)) + yellow(line.substring(13, 26)) + orange(line.substring(26, 39)) + red(line.substring(39)));
console.log(white('  Welcome to BUMBA - Let\'s get you set up'));
console.log(green(line.substring(0, 13)) + yellow(line.substring(13, 26)) + orange(line.substring(26, 39)) + red(line.substring(39)));
console.log();

// Show what's about to happen
if (!options.silent) {
  console.log(white('What BUMBA will give you:'));
  console.log();
  console.log('  ' + green('🟢') + ' Backend agents working in parallel');
  console.log('  ' + yellow('🟡') + ' Strategic planning and architecture');
  console.log('  ' + orange('🟠') + ' Comprehensive testing coverage');
  console.log('  ' + red('🔴') + ' Frontend and design implementation');
  console.log('  ' + white('🏁') + ' All working simultaneously, no conflicts');
  console.log();
  console.log(gray('  Installation takes less than 60 seconds...'));
  console.log();
}

// Run the installer
install(options)
  .then(() => {
    console.log();
    console.log(green('═'.repeat(52)));
    console.log(white('🏁 BUMBA is ready!'));
    console.log(green('═'.repeat(52)));
    console.log();
    console.log(white('Start building with:'));
    console.log();
    console.log('  ' + gray('$') + ' npm start');
    console.log('  ' + gray('$') + ' /bumba:menu');
    console.log();
    console.log(gray('Your development speed just multiplied.'));
    console.log();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n' + red('🔴 Installation failed:'), error.message);
    console.log(yellow('\nTroubleshooting: https://github.com/bumba-ai/bumba/issues\n'));
    process.exit(1);
  });