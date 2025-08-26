/**
 * BUMBA Notion Sync Command
 * Allows manual triggering of Notion dashboard updates
 */

const { logger } = require('../logging/bumba-logger');

class NotionSyncCommand {
  constructor() {
    this.name = 'notion:sync';
    this.description = 'Manually sync dashboard metrics to Notion';
    this.aliases = ['notion:update', 'notion:publish'];
  }

  /**
   * Execute manual sync
   */
  async execute(args = {}) {
    try {
      logger.info('🔄 Initiating manual Notion sync...');
      
      // Get the Notion publisher
      const { getNotionPublisher } = require('../dashboard/notion-publisher');
      const publisher = getNotionPublisher();
      
      // Check if Notion is enabled
      const status = publisher.getStatus();
      
      if (!status.enabled) {
        return {
          success: false,
          message: '❌ Notion integration is not enabled. Run: node scripts/setup-notion.js'
        };
      }
      
      // Perform manual sync
      const result = await publisher.manualSync();
      
      if (result.success) {
        // Get updated status
        const newStatus = publisher.getStatus();
        
        return {
          success: true,
          message: result.message,
          details: {
            mode: newStatus.mode,
            lastPublish: new Date(newStatus.lastPublish).toLocaleString(),
            publishCount: newStatus.publishCount,
            nextAutoSync: newStatus.autoPublish 
              ? `in ${Math.round((publisher.config.publishInterval - (Date.now() - newStatus.lastPublish)) / 60000)} minutes`
              : 'Auto-sync disabled'
          }
        };
      } else {
        return {
          success: false,
          message: result.message
        };
      }
      
    } catch (error) {
      logger.error('Manual sync failed:', error);
      return {
        success: false,
        message: `Failed to sync: ${error.message}`
      };
    }
  }

  /**
   * Get command help
   */
  getHelp() {
    return {
      usage: '/bumba:notion:sync [options]',
      description: this.description,
      options: [
        '--force    Force sync even if recently synced',
        '--full     Include all historical metrics',
        '--test     Test mode without actually publishing'
      ],
      examples: [
        '/bumba:notion:sync              # Standard manual sync',
        '/bumba:notion:sync --force      # Force immediate sync',
        '/bumba:notion:sync --test       # Test without publishing'
      ],
      notes: [
        '• Default auto-sync interval: 1 hour',
        '• Manual sync bypasses the schedule',
        '• Metrics are batched for efficiency',
        '• Configure in .env or run: node scripts/setup-notion.js'
      ]
    };
  }
}

module.exports = NotionSyncCommand;