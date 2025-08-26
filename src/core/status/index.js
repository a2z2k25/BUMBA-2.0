/**
 * BUMBA Status Line Module
 * User-friendly, automatic token tracking for any Claude Code user
 * 
 * Features:
 * - Zero configuration required
 * - Works with any Claude model
 * - Persists usage data
 * - Customizable display formats
 * - No hardcoded credentials
 */

// Auto-initialize the status line
const autoInit = require('./auto-init');

// Export the main components
module.exports = {
  // Get the active status line instance
  getStatusLine: () => {
    const { getStatusLine } = require('./status-line-manager');
    return getStatusLine();
  },
  
  // Enable the status line
  enable: () => {
    const statusLine = module.exports.getStatusLine();
    statusLine.start();
    console.log('🏁 BUMBA Status Line enabled');
  },
  
  // Disable the status line
  disable: () => {
    const statusLine = module.exports.getStatusLine();
    statusLine.stop();
    console.log('⏸️ BUMBA Status Line disabled');
  },
  
  // Configure the status line
  configure: (options) => {
    const statusLine = module.exports.getStatusLine();
    statusLine.configure(options);
    console.log('🟢️ BUMBA Status Line configured');
  },
  
  // Get current statistics
  getStats: () => {
    const statusLine = module.exports.getStatusLine();
    return statusLine.getStats();
  },
  
  // Manually track tokens (for testing or custom integrations)
  trackTokens: (count) => {
    const statusLine = module.exports.getStatusLine();
    statusLine.updateTokens(count);
  },
  
  // Reset session counters
  resetSession: () => {
    const statusLine = module.exports.getStatusLine();
    statusLine.resetSession();
    console.log('🔄 Session counters reset');
  },
  
  // Show current status
  showStatus: () => {
    const statusLine = module.exports.getStatusLine();
    const stats = statusLine.getStats();
    
    console.log('\n📊 BUMBA Status Line Statistics:');
    console.log('================================');
    console.log(`Model: ${stats.model.name}`);
    console.log(`Session Tokens: ${stats.session.tokens}`);
    console.log(`Session Messages: ${stats.session.messages}`);
    console.log(`Session Duration: ${Math.floor(stats.session.duration / 1000)}s`);
    console.log(`Estimated Cost: $${stats.session.cost}`);
    console.log(`Total Tokens: ${stats.total.tokens}`);
    console.log(`Total Messages: ${stats.total.messages}`);
    console.log('================================\n');
  }
};

// Provide a simple CLI interface if run directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'enable':
      module.exports.enable();
      break;
      
    case 'disable':
      module.exports.disable();
      break;
      
    case 'status':
      module.exports.showStatus();
      break;
      
    case 'reset':
      module.exports.resetSession();
      break;
      
    case 'test':
      console.log('Testing status line with sample tokens...');
      module.exports.enable();
      module.exports.trackTokens(1500);
      setTimeout(() => {
        module.exports.trackTokens(2500);
      }, 1000);
      setTimeout(() => {
        module.exports.showStatus();
      }, 2000);
      break;
      
    default:
      console.log(`
BUMBA Status Line - Usage:
  node src/core/status enable   - Enable the status line
  node src/core/status disable  - Disable the status line
  node src/core/status status   - Show current statistics
  node src/core/status reset    - Reset session counters
  node src/core/status test     - Test with sample data
      `);
  }
}