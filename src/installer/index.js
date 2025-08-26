/**
 * BUMBA Modular Installer
 * Orchestrates the installation process using modular components
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const secureExecutor = require('../core/security/secure-executor');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');

// Import modules
const {
  displayLogo,
  displayVersion,
  displayStatus,
  displayPhase,
  createBox,
  animatedProgress,
  displayInterlockingGears,
  resetTerminalBackground,
  colors
} = require('./display');
const { analyzeExistingFrameworks } = require('./framework-detector');
const { installMCPServers } = require('./mcp-installer');
const { installQualityTools } = require('./quality-tools');
const { generateFrameworkFiles } = require('./file-generator');
const { generateQualityHooks } = require('./hook-generator');
const { logger } = require('../core/logging/bumba-logger');

// Import new modules
const { runWizard, getQuickStartGuide } = require('./interactive-wizard');
const { 
  displayFeatureShowcase,
  displayComparisonTable,
  displayCapabilityDetection,
  displaySuccessMetrics,
  displayBenefits
} = require('./feature-showcase');
const {
  runOnboarding,
  displayQuickReference,
  setupIntegrations
} = require('./onboarding-guide');

// Configuration
const FRAMEWORK_VERSION = '2.0';
const INSTALL_DIR = path.join(os.homedir(), '.claude');
const BACKUP_DIR = path.join(os.homedir(), '.claude-backup-' + Date.now());

/**
 * Create backup of existing installation
 */
async function createBackup(analysis) {
  if (analysis.hasClaudeDir) {
    displayStatus('Creating backup...', 'working');
    try {
      await secureExecutor.execute('cp', ['-r', INSTALL_DIR, BACKUP_DIR]);
      displayStatus(`Backup created: ${path.basename(BACKUP_DIR)}`, 'success');
    } catch (error) {
      displayStatus('Backup skipped (permission denied)', 'warning');
    }
  }
}

/**
 * Display installation summary with positive framing
 */
function displayInstallationSummary(config = {}) {
  displayPhase('INSTALLATION COMPLETE', '🟢');

  const components = [
    { name: 'BUMBA Framework', status: '🏁 INSTALLED', desc: 'Professional orchestration' },
    { name: '58 Commands', status: '🏁 INSTALLED', desc: 'Full command suite' },
    { name: 'Multi-Agent System', status: '🏁 INSTALLED', desc: '3 departments, 33 specialists' },
    { name: 'Quality Gates', status: '🏁 INSTALLED', desc: 'Automated validation' },
    { name: 'MCP Servers', status: '🟢 DOCUMENTED', desc: '25+ integration guides' },
    { name: 'Notion Integration', status: '🟢 SETUP AVAILABLE', desc: 'Run: /bumba:notion-setup' },
    { name: 'Figma Integration', status: '🟢 SETUP AVAILABLE', desc: 'Run: /bumba:figma-setup' },
    { name: 'GitHub Integration', status: '🟢 SETUP AVAILABLE', desc: 'Run: /bumba:github-setup' }
  ];

  console.log('\n');
  components.forEach(comp => {
    const statusColor = comp.status.includes('INSTALLED') ? colors.green :
                       comp.status.includes('DOCUMENTED') ? colors.yellowGreen :
                       colors.yellow;
    
    console.log(
      statusColor(comp.status.padEnd(20)) +
      colors.white(comp.name.padEnd(25)) +
      colors.gray(comp.desc)
    );
  });

  // Success box with benefits
  const successBox = createBox(
    colors.success.bold('🏁  BUMBA FRAMEWORK INSTALLED!  🏁') + '\n' +
    '\n' +
    colors.white('🟢 3-5x faster development') + '\n' +
    colors.white('🟢 33 AI specialists ready') + '\n' +
    colors.white('🏁 Enterprise quality gates active')
    , 55);

  console.log('\n' + successBox + '\n');

  // Tailored quick start based on experience
  const experience = config.experience || 'intermediate';
  const quickStart = getQuickStartGuide(experience);
  
  console.log(colors.yellowGreen.bold('🟢 Quick Start Commands:'));
  quickStart.forEach((item, i) => {
    console.log(`  ${i + 1}. ${colors.green(item.cmd)}`);
    console.log(`     ${colors.gray(item.desc)}`);
  });

  console.log('\n' + colors.yellow('🟢 Pro tip: ') + colors.white('Start with /bumba:menu to explore all 58 commands'));
  console.log(colors.gray('\nIntegrations can be configured anytime with setup commands above'));

  // Final celebration banner
  const finalBox = createBox(
    colors.yellow.bold('🟢  SUCCESS!  🟢') + '\n' +
    '\n' +
    colors.white('BUMBA Framework Ready!') + '\n' +
    colors.white('Your Professional Development Platform Awaits')
    , 60);

  console.log('\n' + finalBox + '\n');
}

/**
 * Main installation function
 */
async function install(options = {}) {
  try {
    // Display branding
    displayLogo();
    displayVersion(FRAMEWORK_VERSION);

    // Display feature showcase first
    displayFeatureShowcase();
    
    // Show comparison table
    displayComparisonTable();

    // Display interlocking gears showing mechanical precision
    displayInterlockingGears();

    // Run interactive wizard if not in silent mode
    let config = options;
    if (!options.silent) {
      const wizardResult = await runWizard();
      if (!wizardResult) {
        console.log(colors.yellow('Installation cancelled by user'));
        process.exit(0);
      }
      config = { ...options, ...wizardResult };
    }

    // Initialize
    await animatedProgress('Initializing BUMBA installation', 1500);
    displayStatus('Installation initialized', 'success');

    displayPhase('System Configuration Analysis', '🟢');

    // Analyze existing setup
    const analysis = analyzeExistingFrameworks(INSTALL_DIR);
    
    // Display capability detection with positive framing
    displayCapabilityDetection(analysis);

    if (analysis.frameworks.length > 0) {
      displayStatus('Existing setup detected - will enhance, not replace', 'success');
      
      console.log('\n' + colors.yellowGreen.bold('🟢 BUMBA Enhancement Strategy:'));
      console.log(colors.white('  🏁 Preserve your valuable configurations'));
      console.log(colors.white('  🏁 Add professional quality gates'));
      console.log(colors.white('  🏁 Enable 33 AI specialists'));
      console.log(colors.white('  🏁 Activate parallel execution'));
      console.log(colors.white('  🏁 Create unified command experience'));

      // Create backup
      await createBackup(analysis);
    }

    // Installation steps with progress
    displayPhase('Installing Core Components', '🟢');

    console.log('\n');
    await animatedProgress('Installing quality tools', 2000);
    await installQualityTools();
    displayStatus('Quality tools installed', 'success');

    console.log('\n');
    await animatedProgress('Documenting MCP servers', 2500);
    await installMCPServers();
    displayStatus('MCP ecosystem documented', 'success');

    console.log('\n');
    await animatedProgress('Generating framework files', 1500);
    await generateFrameworkFiles(INSTALL_DIR, FRAMEWORK_VERSION);
    displayStatus('Framework files generated', 'success');

    console.log('\n');
    await animatedProgress('Creating quality hooks', 1000);
    await generateQualityHooks(path.join(INSTALL_DIR, 'hooks'));
    displayStatus('Quality hooks created', 'success');

    // Display benefits before summary
    displayBenefits();
    
    // Display success with config
    displayInstallationSummary(config);
    
    // Show success metrics
    displaySuccessMetrics();

    // Play welcome ceremony sound if possible
    try {
      await secureExecutor.execute(
        path.join(INSTALL_DIR, 'hooks', 'bumba-completion.sh'),
        [],
        { timeout: 5000 }
      );
    } catch (error) {
      // Audio is optional - don't fail installation
    }

    console.log(colors.yellow.bold('\n🟢 Welcome to BUMBA - Your AI Development Accelerator! 🟢\n'));

    // Ask if user wants onboarding
    if (!config.skipOnboarding) {
      const inquirer = require('inquirer');
      const { wantOnboarding } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'wantOnboarding',
          message: 'Would you like a quick interactive tutorial?',
          default: true
        }
      ]);

      if (wantOnboarding) {
        await runOnboarding(config.experience || 'intermediate');
      }
    }

    // Display quick reference
    displayQuickReference();

    // Optional: Set up integrations
    if (!config.skipIntegrations) {
      const inquirer = require('inquirer');
      const { wantIntegrations } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'wantIntegrations',
          message: 'Would you like to set up integrations now?',
          default: false
        }
      ]);

      if (wantIntegrations) {
        await setupIntegrations();
      }
    }

    // Final message
    console.log('\n' + createBox(
      colors.green.bold('🏁 BUMBA is Ready! 🏁') + '\n' +
      '\n' +
      colors.white('Start with: ') + colors.yellow('/bumba:menu') + '\n' +
      colors.gray('Your AI development journey begins now!')
      , 50));

    // Reset terminal
    resetTerminalBackground();
  } catch (error) {
    console.log('\n' + colors.red.bold('🟢 Installation failed: ' + error.message));

    // Provide helpful error context
    if (error.message.includes('claude mcp')) {
      console.log(colors.warning('\n🟢 Suggestion: Ensure Claude Code is installed and updated'));
      console.log(colors.gray('   Visit: https://claude.ai/code for the latest version\n'));
    } else if (error.message.includes('permission')) {
      console.log(colors.warning('\n🟢 Suggestion: Try running with appropriate permissions'));
      console.log(colors.gray('   You may need to run: chmod +x ~/.claude/hooks/*\n'));
    } else if (error.message.includes('ENOENT')) {
      console.log(colors.warning('\n🟢 Suggestion: Required command not found'));
      console.log(colors.gray('   Common missing tools: curl, bash, node\n'));
    } else {
      console.log(colors.warning('\n🟢 For help, visit: https://github.com/a2z2k25/bumba-claude/issues'));
      console.log(colors.gray('   Include the error message above when reporting issues\n'));
    }

    resetTerminalBackground();
    process.exit(1);
  }
}

module.exports = {
  install,
  FRAMEWORK_VERSION,
  INSTALL_DIR
};
