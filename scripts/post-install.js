#!/usr/bin/env node

/**
 * BUMBA Post-Install Welcome
 * First impression after npm install
 */

const chalk = require('chalk');

// BUMBA gradient colors
const green = chalk.hex('#52C41A');
const yellow = chalk.hex('#FAAD14');
const orange = chalk.hex('#FA8C16');
const red = chalk.hex('#F5222D');
const white = chalk.hex('#FFFFFF');
const gray = chalk.hex('#808080');
const dim = chalk.hex('#595959');

// Clear for impact
console.log();

// Mini logo
console.log(green('  ██████╗ ') + yellow('██╗   ██╗') + orange('███╗   ███╗') + red('██████╗  █████╗'));
console.log(green('  ██████╔╝') + yellow('██║   ██║') + orange('██╔████╔██║') + red('██████╔╝███████║'));
console.log(green('  ██████╔╝') + yellow('╚██████╔╝') + orange('██║ ╚═╝ ██║') + red('██████╔╝██║  ██║'));
console.log();

// Success message
console.log(white('🏁 BUMBA installed successfully!'));
console.log();

// Quick value prop
console.log(gray('You just installed a framework that turns Claude into'));
console.log(gray('a full development team. Watch multiple agents build'));
console.log(gray('features simultaneously with zero coordination overhead.'));
console.log();

// Next steps with gradient
console.log(white('Get started:'));
console.log();
console.log('  ' + green('npm start') + dim(' .........') + ' Start BUMBA');
console.log('  ' + yellow('/bumba:menu') + dim(' ......') + ' Interactive commands');
console.log('  ' + orange('/bumba:implement') + dim(' .') + ' Build with parallel agents');
console.log('  ' + red('/bumba:help') + dim(' ......') + ' Get help');
console.log();

// Speed promise
console.log(dim('─'.repeat(52)));
console.log(gray('What takes hours becomes minutes.'));
console.log(gray('What takes days becomes hours.'));
console.log(dim('─'.repeat(52)));
console.log();