#!/usr/bin/env node

/**
 * BUMBA Framework Installer
 * Standalone installer script for setting up BUMBA Framework
 */

const { install } = require('./src/installer');

// Run installation
install().catch(error => {
  console.error('Installation failed:', error.message);
  process.exit(1);
});