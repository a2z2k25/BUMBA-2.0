#!/usr/bin/env node

/**
 * BUMBA Notion Setup Script
 * Interactive configuration for Notion integration
 */

const { runSetupWizard } = require('../src/core/setup/notion-setup-wizard');

console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║     BUMBA Framework - Notion Setup            ║
║     Configure Your Notion Integration         ║
║                                                ║
╚════════════════════════════════════════════════╝
`);

// Run the setup wizard
runSetupWizard()
  .then(() => {
    console.log('\n✨ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });