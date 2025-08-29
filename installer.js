#!/usr/bin/env node

/**
 * BUMBA CLI Installer
 * Standalone installer script for setting up BUMBA CLI
 */

const { install } = require('./src/installer');

// Run installation
install().catch(error => {
  console.error('Installation failed:', error.message);
  process.exit(1);
});