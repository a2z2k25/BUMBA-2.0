/**
 * BUMBA Metrics Dashboard Command
 * Real-time performance and health visualization
 */

const { logger } = require('../core/logging/bumba-logger');
const { BumbaFramework2 } = require('../core/bumba-framework-2');

module.exports = {
  name: 'metrics',
  description: 'Launch real-time metrics dashboard',
  usage: '/bumba:metrics [port]',
  category: 'system',

  async execute(args = [], context = {}) {
    try {
      const port = parseInt(args[0]) || 3000;

      logger.info('🟢 Launching BUMBA Metrics Dashboard...');

      // Get framework instance
      const framework = global.bumbaFramework || new BumbaFramework2();

      // Start dashboard
      const dashboard = framework.startMetricsDashboard(port);

      return {
        success: true,
        message: `🟢 Metrics Dashboard launched at http://localhost:${port}`,
        instructions: [
          `Open your browser to: http://localhost:${port}`,
          'Real-time metrics including:',
          '  • Command execution statistics',
          '  • Routing performance',
          '  • Resource usage',
          '  • Health status',
          '  • Performance metrics',
          '',
          'To stop the dashboard, use: /bumba:metrics stop'
        ].join('\n')
      };

    } catch (error) {
      logger.error('Failed to start metrics dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async handleStop(framework) {
    framework.stopMetricsDashboard();
    return {
      success: true,
      message: '🟢 Metrics Dashboard stopped'
    };
  }
};
