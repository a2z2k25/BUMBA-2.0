/**
 * BUMBA Failure Manager Initialization
 */

const { getInstance: getFailureManager } = require('../resilience/unified-failure-manager');
const { getInstance: getNotificationSystem } = require('../resilience/failure-notifications');
const { logger } = require('../logging/bumba-logger');

class FailureManagerInitializer {
  static async initialize() {
    logger.info('🛡️ Initializing Failure Management System...');
    
    try {
      // Get instances
      const failureManager = getFailureManager();
      const notificationSystem = getNotificationSystem();
      
      // Connect notification system to failure manager
      failureManager.registerNotificationHandler(async (notification) => {
        await notificationSystem.notify(notification);
      });
      
      // Register recovery notification handler
      failureManager.on('recovery', async (failure) => {
        await notificationSystem.sendRecoveryNotification(failure);
      });
      
      // Register critical failure handler
      failureManager.on('critical-failure', async (failure) => {
        await notificationSystem.sendCriticalAlert(failure);
      });
      
      // Set up periodic cleanup
      setInterval(() => {
        failureManager.cleanupFailures();
      }, 3600000); // Every hour
      
      // Configure based on environment
      if (process.env.NODE_ENV === 'production') {
        failureManager.config.autoRecovery = true;
        failureManager.config.persistFailures = true;
        notificationSystem.configure({
          soundEnabled: false,
          consoleEnabled: false,
          fileEnabled: true
        });
      } else {
        notificationSystem.configure({
          soundEnabled: true,
          consoleEnabled: true,
          fileEnabled: true
        });
      }
      
      logger.info('✅ Failure Management System initialized');
      
      // Return for global access
      return {
        failureManager,
        notificationSystem
      };
      
    } catch (error) {
      logger.error('Failed to initialize Failure Management:', error);
      throw error;
    }
  }
  
  static async shutdown() {
    logger.info('🔚 Shutting down Failure Management System...');
    
    const failureManager = getFailureManager();
    
    // Get final statistics
    const stats = failureManager.getStatistics();
    
    logger.info('Failure Management Statistics:', stats);
    
    // Persist remaining failures
    if (failureManager.config.persistFailures) {
      for (const [id, failure] of failureManager.failures) {
        await failureManager.persistFailure(failure);
      }
    }
    
    logger.info('✅ Failure Management System shut down');
  }
}

module.exports = FailureManagerInitializer;