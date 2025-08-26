/**
 * BUMBA Quality Tools Installation Module
 * Manages quality tool detection and installation
 */

const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { logger } = require('../core/logging/bumba-logger');

/**
 * Install quality enforcement tools
 */
async function installQualityTools() {
  const spinner = ora('Installing BUMBA Quality Enforcement Tools...').start();

  let qltyStatus = 'failed';

  try {
    // Check if qlty exists using async exec
    const { stdout } = await exec('qlty --version');
    if (stdout) {
      qltyStatus = 'existing';
    }
  } catch (error) {
    // Check if qlty is already installed
    const platform = os.platform();
    try {
      await exec('qlty --version');
      qltyStatus = 'installed';
    } catch (checkError) {
      // Don't automatically install - just inform the user
      qltyStatus = 'not-installed';
      spinner.text = 'qlty code quality tool not found';

      console.log(chalk.yellow('\n🟢 qlty code quality tool is not installed.'));
      console.log(chalk.gray('To install qlty, please run:'));

      if (platform === 'darwin' || platform === 'linux') {
        console.log(chalk.cyan('  curl -fsSL https://qlty.sh | bash'));
      } else if (platform === 'win32') {
        console.log(chalk.cyan('  powershell -c "iwr https://qlty.sh | iex"'));
      }

      console.log(chalk.gray('\nqlty provides advanced code quality analysis.'));
      console.log(chalk.gray('BUMBA will continue to work without it.\n'));
    }
  }

  spinner.stop();
  displayQualityToolsStatus(qltyStatus);
  return qltyStatus !== 'failed';
}

/**
 * Display quality tools installation status
 */
function displayQualityToolsStatus(qltyStatus) {
  logger.info('🏁 BUMBA Quality Tools Status\n');
  logger.info('Note: Quality tools enhance the framework but are not required for basic operation.\n');

  const table = new Table({
    head: ['Tool', 'Purpose', 'Status'],
    style: { head: [], border: [] }
  });

  let statusDisplay;
  switch (qltyStatus) {
    case 'installed':
      statusDisplay = '🏁 INSTALLED';
      break;
    case 'existing':
      statusDisplay = '🏁 EXISTS';
      break;
    case 'not-installed':
      statusDisplay = chalk.yellow('🟢 NOT INSTALLED');
      break;
    case 'failed':
      statusDisplay = chalk.dim('🏁 FAILED');
      break;
  }

  table.push(['qlty', 'Code quality enforcement & automatic fixing', statusDisplay]);

  logger.info(table.toString() + '\n');

  if (qltyStatus === 'failed' || qltyStatus === 'not-installed') {
    logger.info('🏁 qlty Installation - Manual Steps:');
    logger.info('BUMBA works perfectly without qlty, but installing it enables advanced code quality features.');
    logger.info(chalk.dim('  • First install xz: brew install xz (macOS) or apt install xz-utils (Linux)'));
    logger.info(chalk.dim('  • Then install qlty: curl -fsSL https://qlty.sh | bash'));
    logger.info(chalk.dim('  • Windows: powershell -c "iwr https://qlty.sh | iex"'));
    logger.info('  • Alternative: Use your existing linters and formatters\n');
  }
}

module.exports = {
  installQualityTools
};
