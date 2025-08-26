/**
 * BUMBA Installer Display Module
 * Handles all visual output and UI elements
 * Enhanced with retro terminal styling
 */

const chalk = require('chalk');

// Enhanced color palette using only BUMBA gradient colors
const colors = {
  // Original gradient colors - now used for ALL elements
  gradient: [
    chalk.hex('#00AA00'), // Rich green
    chalk.hex('#66BB00'), // Yellow-green
    chalk.hex('#FFDD00'), // Golden yellow
    chalk.hex('#FFAA00'), // Orange-yellow
    chalk.hex('#FF6600'), // Orange-red
    chalk.hex('#DD0000') // Deep red
  ],
  // Map gradient colors to UI elements
  green: chalk.hex('#00AA00'), // Rich green (gradient[0])
  yellowGreen: chalk.hex('#66BB00'), // Yellow-green (gradient[1])
  yellow: chalk.hex('#FFDD00'), // Golden yellow (gradient[2])
  orange: chalk.hex('#FFAA00'), // Orange-yellow (gradient[3])
  orangeRed: chalk.hex('#FF6600'), // Orange-red (gradient[4])
  red: chalk.hex('#DD0000'), // Deep red (gradient[5])

  // Utility colors
  white: chalk.white,
  gray: chalk.gray,

  // Semantic mappings using gradient colors
  success: chalk.hex('#00AA00'), // Green
  info: chalk.hex('#66BB00'), // Yellow-green
  warning: chalk.hex('#FFAA00'), // Orange-yellow
  error: chalk.hex('#DD0000'), // Red
  progress: chalk.hex('#66BB00'), // Yellow-green for progress bars
  border: chalk.hex('#FFDD00'), // Golden yellow for borders

  // Keep original gold/wheat for framework branding
  gold: chalk.hex('#D4AF37'),
  wheat: chalk.hex('#F5DEB3')
};

/**
 * Display the BUMBA logo with gradient colors
 */
function displayLogo() {
  console.clear();

  const bumbaLines = [
    '██████╗ ██╗   ██╗███╗   ███╗██████╗  █████╗ ',
    '██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔══██╗',
    '██████╔╝██║   ██║██╔████╔██║██████╔╝███████║',
    '██╔══██╗██║   ██║██║╚██╔╝██║██╔══██╗██╔══██║',
    '██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║',
    '╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝'
  ];


  // Create padded lines to fill terminal width
  const terminalWidth = process.stdout.columns || 80;
  const padLine = (text = '') => {
    const padding = Math.max(0, terminalWidth - text.length);
    return text + ' '.repeat(padding);
  };

  console.log();
  bumbaLines.forEach((line, index) => {
    const colorFunc = colors.gradient[index] || colors.gradient[colors.gradient.length - 1];
    console.log(colorFunc.bold(line));
  });

  console.log();
  console.log(colors.gold('▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄'));
  console.log(colors.gold.bold('CLAUDE CODE MASTERY FRAMEWORK'));
  console.log(colors.gold('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀'));
  console.log();
  console.log(colors.wheat('Professional • Intelligent • Secure'));
  console.log(colors.wheat('Designer-Optimized • Enterprise-Ready'));
}

/**
 * Display version and attribution
 */
function displayVersion(version) {
  const versionBox = createBox(
    colors.yellow.bold('🟢 BUMBA FRAMEWORK INSTALLER 🟢') + '\n' +
    '\n' +
    colors.white(`Version ${version}`) + '\n' +
    colors.gray('By Professional Framework Team')
    , 48);

  console.log('\n' + versionBox);
  console.log('\n' + colors.yellow.bold('🏁 BUMBA INSTALLATION INITIATING 🏁\n'));
}

/**
 * Create a bordered box with corner decorations
 */
function createBox(content, width = 50) {
  const top = colors.border('┌' + '─'.repeat(width - 2) + '┐');
  const bottom = colors.border('└' + '─'.repeat(width - 2) + '┘');
  const side = colors.border('│');

  const lines = content.split('\n');
  const boxLines = [top];

  lines.forEach(line => {
    const strippedLength = line.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').length;
    const padding = width - strippedLength - 2;
    // Add single space at start for left alignment, padding at end
    const paddedLine = ' ' + line + ' '.repeat(Math.max(0, padding - 1));
    boxLines.push(side + paddedLine + side);
  });

  boxLines.push(bottom);
  return boxLines.join('\n');
}

/**
 * Create a progress bar
 */
function createProgressBar(percent, width = 50, label = '') {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  const bar = colors.progress('═'.repeat(filled)) + colors.gray('─'.repeat(empty));
  const percentStr = ` ${percent}%`;
  return `${label}${bar}${percentStr}`;
}

/**
 * Display status message with icon
 */
function displayStatus(message, type = 'info') {
  const icons = {
    info: colors.info('ℹ'), // Yellow-green
    success: colors.success('🏁'), // Green
    warning: colors.warning('🟢'), // Orange-yellow
    error: colors.error('🟢'), // Red
    working: colors.yellowGreen('🟢'), // Yellow-green
    complete: colors.success('🟢') // Green
  };

  const icon = icons[type] || icons.info;
  console.log(`${icon} ${message}`);
}

/**
 * Display phase separator
 */
function displayPhase(phase, icon = '🟢') {
  console.log(colors.yellow(`\n${icon} ${phase}`));
  console.log(colors.gray('─'.repeat(60)));
}

/**
 * Create animated progress (with terminal compatibility)
 */
function animatedProgress(label, duration = 3000) {
  return new Promise((resolve) => {
    let percent = 0;
    const increment = 100 / (duration / 100);

    // Check if we're in a TTY environment
    const isTTY = process.stdout.isTTY;

    if (!isTTY) {
      console.log(`${colors.white(label)} ${createProgressBar(100, 40, '')}`);
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (process.stdout.clearLine) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
      }

      const bar = createProgressBar(percent, 40, '');
      process.stdout.write(`${colors.white(label)} ${bar}`);

      percent += increment;
      if (percent >= 100) {
        percent = 100;
        if (process.stdout.clearLine) {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
        }
        console.log(`${colors.white(label)} ${createProgressBar(100, 40, '')}`);
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

/**
 * Display INTERLOCKING GEARS ASCII art
 */
function displayInterlockingGears() {
  const gears = [
    { line: '🟢════🟢════🟢════🟢════🟢════🟢════🟢════🟢════🟢', color: 0 },
    { line: '║    ║    ║    ║    ║    ║    ║    ║    ║', color: 1 },
    { line: '🟢────🟢────🟢────🟢────🟢────🟢────🟢────🟢────🟢', color: 2 },
    { line: '║ 🟢══🟢══🟢══🟢══🟢══🟢══🟢══🟢══🟢══🟢══🟢══🟢 ║', color: 3 },
    { line: '║ ║  ║  ║  ║  ║  ║  ║  ║  ║  ║  ║  ║ ║', color: 4 },
    { line: '║ 🟢──🟢──🟢──🟢──🟢──🟢──🟢──🟢──🟢──🟢──🟢──🟢 ║', color: 5 },
    { line: '║    ║    ║    ║    ║    ║    ║    ║    ║', color: 4 },
    { line: '🟢════🟢════🟢════🟢════🟢════🟢════🟢════🟢════🟢', color: 3 }
  ];

  console.log('\n');
  console.log(colors.yellow.bold('🟢  MECHANICAL PRECISION  🟢'));
  console.log(colors.gray('─'.repeat(60)));

  gears.forEach(({ line, color }) => {
    const colorFunc = colors.gradient[color] || colors.gradient[0];
    console.log(colorFunc.bold(line));
  });

  console.log(colors.gray('─'.repeat(60)));
  console.log(colors.yellowGreen('Interlocking systems working in perfect harmony\n'));
}

/**
 * Reset terminal formatting
 */
function resetTerminalBackground() {
  process.stdout.write('\x1b[0m'); // Reset all formatting
  process.stdout.write('\x1b[49m'); // Reset background color
}

module.exports = {
  displayLogo,
  displayVersion,
  displayStatus,
  displayPhase,
  createBox,
  createProgressBar,
  animatedProgress,
  displayInterlockingGears,
  resetTerminalBackground,
  colors
};
