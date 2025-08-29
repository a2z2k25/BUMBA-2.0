#!/usr/bin/env node

/**
 * BUMBA CLI 2.0 - Main Entry Point
 * 
 * This is the primary entry point for the BUMBA CLI.
 * For installation, use: npm run install or node installer.js
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Apply BUMBA theme by default
try {
  const theme = require('./core/themes/bumba-theme-minimal');
  theme.apply();
} catch (e) {
  // Theme not available yet, continue without it
}

// Check if this is being run as a CLI command
const isCliMode = require.main === module;

// Check for installation
function checkInstallation() {
  const configPath = path.join(process.cwd(), '.bumba-config.json');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(configPath) && !fs.existsSync(envPath)) {
    console.log(chalk.yellow('🟡 BUMBA CLI not configured.'));
    console.log(chalk.yellow('Please run: npm run install'));
    console.log(chalk.gray('Or: node installer.js'));
    return false;
  }
  return true;
}

// Initialize framework
async function initializeFramework() {
  try {
    // Check for quick start mode
    const quickStart = require('./core/quick-start');
    const quickStartResult = await quickStart.initialize();
    
    if (quickStartResult.mode === 'quick-start') {
      quickStart.showQuickStartGuide();
    }
    
    // Initialize widget system
    const { BumbaWidgets } = require('./core/widgets');
    global.BumbaWidgets = BumbaWidgets;
    
    // Load the main framework
    const { createBumbaFramework } = require('./core/bumba-framework-2');
    
    console.log(chalk.green('🟢 Initializing BUMBA CLI 2.0...'));
    
    // Validate APIs before framework initialization
    console.log(chalk.blue('🔍 Validating API configurations...'));
    try {
      const { validate } = require('./core/validation/api-validator');
      const apiValidation = await validate();
      
      if (apiValidation.overall === 'critical') {
        console.log(chalk.red('🟠️ No valid APIs found - running in offline mode'));
      } else if (apiValidation.overall === 'degraded') {
        console.log(chalk.yellow('🟠️ Some APIs invalid - limited functionality'));
      } else {
        console.log(chalk.green('🏁 API validation complete'));
      }
    } catch (error) {
      console.log(chalk.yellow('🟠️ API validation skipped:', error.message));
    }
    
    // Initialize Notion Hub
    console.log(chalk.blue('🔗 Initializing Notion integration...'));
    try {
      const { getInstance: getNotionHub } = require('./core/integrations/notion-hub');
      const notionHub = getNotionHub();
      await notionHub.initialize();
      console.log(chalk.green('🏁 Notion integration ready'));
    } catch (error) {
      console.log(chalk.yellow('🟠️ Notion unavailable - using fallback mode'));
    }
    
    // Create and initialize framework instance
    const framework = await createBumbaFramework({
      skipInit: false,
      legacy: false,
      disableMonitoring: process.env.BUMBA_DISABLE_MONITORING === 'true',
      quickStart: quickStartResult
    });
    
    // Initialize Status Line System if enabled
    if (process.env.BUMBA_STATUS_LINE !== 'false') {
      try {
        const { initializeStatusLine } = require('./core/status/auto-init');
        const statusLine = initializeStatusLine();
        
        // Attach to framework for department integration
        framework.statusLine = statusLine;
        
        // Hook into framework token tracking if available
        if (framework.on) {
          framework.on('tokens:used', (count) => {
            statusLine.updateTokens(count);
          });
        }
        
        console.log(chalk.gray('📊 Status Line initialized'));
      } catch (error) {
        // Status line is optional, don't fail if it can't initialize
        console.log(chalk.yellow('🟠️ Status Line unavailable:', error.message));
      }
    }
    
    // Initialize Agent Whispers if enabled
    if (process.env.BUMBA_WHISPERS !== 'false') {
      try {
        const { integrateWhispers } = require('./core/whispers');
        const whispers = integrateWhispers(framework, {
          enabled: true,
          location: process.env.BUMBA_WHISPER_LOCATION || 'title'
        });
        
        console.log(chalk.gray('🟡 Agent Whispers initialized'));
      } catch (error) {
        // Whispers are optional
        console.log(chalk.yellow('🟠️ Agent Whispers unavailable:', error.message));
      }
    }
    
    // Initialize Command Chaining if enabled
    if (process.env.BUMBA_CHAINING !== 'false') {
      try {
        const { integrateChaining } = require('./core/chaining');
        const chaining = integrateChaining(framework, {
          enabled: true,
          maxConcurrent: parseInt(process.env.BUMBA_MAX_CONCURRENT) || 5
        });
        
        // Connect memory if available
        if (framework.memoryMCP) {
          const { getChainMemory } = require('./core/chaining/memory-integration');
          const memory = getChainMemory();
          memory.connectMCP(framework.memoryMCP);
          chaining.memory = memory;
        }
        
        console.log(chalk.gray('🏁 Command Chaining initialized'));
      } catch (error) {
        // Chaining is optional
        console.log(chalk.yellow('🟠️ Command Chaining unavailable:', error.message));
      }
    }
    
    // Add widget system to framework
    try {
      const { BumbaWidgets, widgets } = require('./core/widgets');
      framework.BumbaWidgets = BumbaWidgets;
      framework.widgets = widgets;
      console.log(chalk.gray('🟢 Widget System initialized'));
    } catch (error) {
      console.log(chalk.yellow('🟠️ Widget System unavailable:', error.message));
    }
    
    // Export for programmatic use
    module.exports = framework;
    
    // If running as CLI, start interactive mode
    if (isCliMode) {
      const { startInteractiveMode } = require('./core/interactive-mode');
      
      console.log(chalk.green('🏁 BUMBA CLI Ready!'));
      console.log(chalk.gray('Type /bumba:help for available commands'));
      console.log(chalk.gray('Type /bumba:menu for interactive menu'));
      console.log();
      
      // Start interactive CLI mode if it exists
      if (startInteractiveMode) {
        await startInteractiveMode(framework);
      } else {
        // Just exit cleanly if no interactive mode
        console.log(chalk.green('Framework initialized successfully!'));
        process.exit(0);
      }
    }
    
    return framework;
    
  } catch (error) {
    console.error(chalk.red('🔴 Framework initialization failed:'), error.message);
    console.error(chalk.yellow('Try running: npm run install'));
    process.exit(1);
  }
}

// Main execution
if (isCliMode) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.green.bold('\n🟢 BUMBA CLI 2.0\n'));
    console.log('Usage: bumba [options] [command]');
    console.log('\nOptions:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version information');
    console.log('  --install      Run the installation wizard');
    console.log('\nCommands:');
    console.log('  menu           Show interactive command menu');
    console.log('  help           Show available commands');
    console.log('  status         Show framework status');
    console.log('\nExamples:');
    console.log('  bumba                    # Start interactive mode');
    console.log('  bumba menu               # Show command menu');
    console.log('  bumba --install          # Run installer');
    console.log();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const package = require('../package.json');
    console.log(`BUMBA CLI v${package.version}`);
    process.exit(0);
  }
  
  if (args.includes('--install')) {
    // Run installer
    require('./installer').install().then(() => {
      console.log(chalk.green('🏁 Installation complete!'));
      process.exit(0);
    }).catch(error => {
      console.error(chalk.red('🔴 Installation failed:'), error.message);
      process.exit(1);
    });
  } else {
    // Check installation and initialize
    if (checkInstallation()) {
      initializeFramework();
    } else {
      process.exit(1);
    }
  }
} else {
  // Being required as a module
  const { BumbaWidgets, widgets } = require('./core/widgets');
  
  module.exports = {
    createBumbaFramework: require('./core/bumba-framework-2').createBumbaFramework,
    BumbaFramework2: require('./core/bumba-framework-2').BumbaFramework2,
    initializeFramework,
    BumbaWidgets,
    widgets
  };
}