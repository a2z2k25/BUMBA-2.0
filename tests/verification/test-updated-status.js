#!/usr/bin/env node

/**
 * Test the updated BUMBA-CLAUDE Multi Agent Framework status line
 */

const { getInstance } = require('./src/core/status/dynamic-status-line');

async function testUpdatedStatus() {
  console.clear();
  
  console.log('\n' + '═'.repeat(70));
  console.log('     TESTING UPDATED STATUS LINE FORMAT');
  console.log('═'.repeat(70) + '\n');
  
  // Initialize
  const statusLine = getInstance();
  await statusLine.initialize();
  
  // Show the updated framework name
  console.log('🟢 New Status Line Format:');
  console.log(statusLine.getColoredStatusLine());
  console.log('');
  
  // Show raw text version
  console.log('Raw text: "' + statusLine.generateStatusLine() + '"');
  console.log('');
  
  // Test different display modes
  console.log('─'.repeat(70));
  console.log('Display Modes:\n');
  
  statusLine.setDisplayMode('default');
  console.log('Default: ' + statusLine.generateStatusLine());
  
  statusLine.setDisplayMode('compact');
  console.log('Compact: ' + statusLine.generateStatusLine());
  
  statusLine.setDisplayMode('detailed');
  console.log('Detailed: ' + statusLine.generateStatusLine());
  console.log('');
  
  // Add some tokens to show it with data
  console.log('─'.repeat(70));
  console.log('With Token Data:\n');
  
  statusLine.setDisplayMode('default');
  statusLine.addTokens(50000);
  console.log('After adding 50K tokens:');
  console.log(statusLine.getColoredStatusLine());
  console.log('');
  
  // Show box display with new name
  console.log('─'.repeat(70));
  console.log('Box Display:\n');
  statusLine.displayBox();
  console.log('');
  
  console.log('🏁 Status line successfully updated to:');
  console.log('   "BUMBA-CLAUDE Multi Agent Framework [token counter]"');
  console.log('');
}

testUpdatedStatus().catch(console.error);