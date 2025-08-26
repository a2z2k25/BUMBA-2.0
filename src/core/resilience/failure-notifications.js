/**
 * BUMBA Failure Notification System
 * Provides multiple notification channels for failure events
 */

const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class FailureNotificationSystem {
  constructor() {
    this.channels = new Map();
    this.config = {
      consoleEnabled: true,
      fileEnabled: true,
      soundEnabled: process.platform === 'darwin', // Mac only for now
      webhookEnabled: false,
      emailEnabled: false
    };
    
    // Initialize channels
    this.initializeChannels();
    
    logger.info('📢 Failure Notification System initialized');
  }

  /**
   * Initialize notification channels
   */
  initializeChannels() {
    // Console channel
    this.channels.set('console', {
      name: 'Console',
      enabled: this.config.consoleEnabled,
      async send(notification) {
        const symbol = notification.type === 'CRITICAL' ? '🚨' : '⚠️';
        console.log('\n' + '='.repeat(60));
        console.log(`${symbol} FAILURE NOTIFICATION`);
        console.log('='.repeat(60));
        console.log(`Type: ${notification.type}`);
        console.log(`Time: ${notification.timestamp}`);
        
        if (notification.failure) {
          console.log(`Component: ${notification.failure.context.component}`);
          console.log(`Error: ${notification.failure.error.message}`);
          console.log(`Attempts: ${notification.failure.attempts}`);
        }
        
        if (notification.count) {
          console.log(`Failures in last 5 minutes: ${notification.count}`);
        }
        
        console.log('='.repeat(60) + '\n');
      }
    });
    
    // File channel
    this.channels.set('file', {
      name: 'File',
      enabled: this.config.fileEnabled,
      async send(notification) {
        const logPath = path.join(process.cwd(), 'logs', 'failure-notifications.log');
        const logDir = path.dirname(logPath);
        
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const entry = `[${notification.timestamp}] ${notification.type}: ${JSON.stringify(notification)}\n`;
        fs.appendFileSync(logPath, entry);
      }
    });
    
    // Sound channel (Mac only)
    this.channels.set('sound', {
      name: 'Sound',
      enabled: this.config.soundEnabled,
      async send(notification) {
        if (process.platform !== 'darwin') return;
        
        const { exec } = require('child_process');
        const sound = notification.type === 'CRITICAL' ? 'Basso' : 'Pop';
        
        exec(`afplay /System/Library/Sounds/${sound}.aiff`, (error) => {
          if (error) {
            logger.debug('Failed to play notification sound:', error.message);
          }
        });
      }
    });
    
    // Desktop notification channel
    this.channels.set('desktop', {
      name: 'Desktop',
      enabled: process.platform === 'darwin' || process.platform === 'linux',
      async send(notification) {
        const { exec } = require('child_process');
        
        const title = notification.type === 'CRITICAL' 
          ? '🚨 Critical Failure' 
          : '⚠️ System Failure';
        
        let message = '';
        if (notification.failure) {
          message = `${notification.failure.context.component}: ${notification.failure.error.message}`;
        } else if (notification.count) {
          message = `${notification.count} failures detected in the last 5 minutes`;
        }
        
        if (process.platform === 'darwin') {
          // macOS notification
          const script = `display notification "${message}" with title "${title}" sound name "Basso"`;
          exec(`osascript -e '${script}'`);
        } else if (process.platform === 'linux') {
          // Linux notification
          exec(`notify-send "${title}" "${message}"`);
        }
      }
    });
    
    // Status file channel (for external monitoring)
    this.channels.set('status', {
      name: 'Status File',
      enabled: true,
      async send(notification) {
        const statusPath = path.join(process.cwd(), 'status', 'failure-status.json');
        const statusDir = path.dirname(statusPath);
        
        if (!fs.existsSync(statusDir)) {
          fs.mkdirSync(statusDir, { recursive: true });
        }
        
        const status = {
          lastFailure: notification.timestamp,
          type: notification.type,
          healthy: notification.type !== 'CRITICAL',
          details: notification
        };
        
        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
      }
    });
  }

  /**
   * Send notification to all enabled channels
   */
  async notify(notification) {
    const promises = [];
    
    for (const [id, channel] of this.channels) {
      if (channel.enabled) {
        promises.push(
          channel.send(notification).catch(error => {
            logger.error(`Failed to send notification via ${channel.name}:`, error);
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Send critical alert with escalation
   */
  async sendCriticalAlert(failure) {
    const notification = {
      type: 'CRITICAL',
      failure,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    };
    
    // Send to all channels
    await this.notify(notification);
    
    // Additional escalation for critical failures
    if (this.config.soundEnabled && process.platform === 'darwin') {
      // Play multiple sounds for critical
      const { exec } = require('child_process');
      exec('afplay /System/Library/Sounds/Sosumi.aiff');
      setTimeout(() => {
        exec('afplay /System/Library/Sounds/Sosumi.aiff');
      }, 1000);
    }
  }

  /**
   * Send recovery notification
   */
  async sendRecoveryNotification(failure) {
    const notification = {
      type: 'RECOVERY',
      failure,
      timestamp: new Date().toISOString(),
      message: `System recovered from failure in ${failure.recoveryTime}ms`
    };
    
    // Only send to console and file by default
    const recoveryChannels = ['console', 'file', 'status'];
    
    for (const channelId of recoveryChannels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        await channel.send(notification).catch(error => {
          logger.error(`Failed to send recovery notification:`, error);
        });
      }
    }
  }

  /**
   * Configure notification channels
   */
  configure(config) {
    Object.assign(this.config, config);
    
    // Update channel states
    if (this.channels.has('console')) {
      this.channels.get('console').enabled = this.config.consoleEnabled;
    }
    if (this.channels.has('file')) {
      this.channels.get('file').enabled = this.config.fileEnabled;
    }
    if (this.channels.has('sound')) {
      this.channels.get('sound').enabled = this.config.soundEnabled;
    }
    
    logger.debug('Notification configuration updated');
  }

  /**
   * Add custom notification channel
   */
  addChannel(id, channel) {
    this.channels.set(id, {
      name: channel.name || id,
      enabled: channel.enabled !== false,
      send: channel.send
    });
    
    logger.debug(`Added notification channel: ${id}`);
  }

  /**
   * Get channel status
   */
  getChannelStatus() {
    const status = {};
    
    for (const [id, channel] of this.channels) {
      status[id] = {
        name: channel.name,
        enabled: channel.enabled
      };
    }
    
    return status;
  }

  /**
   * Test notification system
   */
  async testNotifications() {
    console.log('🧪 Testing notification channels...\n');
    
    const testNotification = {
      type: 'TEST',
      timestamp: new Date().toISOString(),
      failure: {
        error: { message: 'This is a test failure' },
        context: { component: 'test', operation: 'notification-test' },
        attempts: 1
      }
    };
    
    for (const [id, channel] of this.channels) {
      if (channel.enabled) {
        try {
          console.log(`Testing ${channel.name}...`);
          await channel.send(testNotification);
          console.log(`✅ ${channel.name} working`);
        } catch (error) {
          console.log(`❌ ${channel.name} failed: ${error.message}`);
        }
      } else {
        console.log(`⏭️  ${channel.name} disabled`);
      }
    }
    
    console.log('\n✅ Notification test complete');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FailureNotificationSystem,
  getInstance: () => {
    if (!instance) {
      instance = new FailureNotificationSystem();
    }
    return instance;
  }
};