#!/usr/bin/env node

/**
 * Test script to verify installer display
 * Run this to see how the installer will appear to new users
 */

console.log('Testing BUMBA installer display...\n');
console.log('This simulates what users will see when installing via npm.\n');
console.log('-----------------------------------------------------------\n');

// Run the post-install script
require('./scripts/post-install.js');