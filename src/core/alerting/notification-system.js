/**
 * BUMBA Notification System
 * Advanced notification delivery system with multiple channels
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

class NotificationSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      batchSize: config.batchSize || 10,
      queueSize: config.queueSize || 1000,
      channels: {
        email: config.channels?.email || false,
        webhook: config.channels?.webhook || false,
        sms: config.channels?.sms || false,
        discord: config.channels?.discord || false,
        teams: config.channels?.teams || false
      },
      templates: config.templates || {},
      ...config
    };
    
    // Notification queue
    this.queue = [];
    this.processing = false;
    
    // Channel handlers
    this.channelHandlers = new Map();
    
    // Delivery history
    this.deliveryHistory = [];
    this.maxHistory = 1000;
    
    // Statistics
    this.stats = {
      sent: 0,
      failed: 0,
      queued: 0,
      byChannel: {}
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize notification system
   */
  async initialize() {
    // Register channel handlers
    this.registerChannelHandlers();
    
    // Load templates
    await this.loadTemplates();
    
    // Start queue processor
    this.startQueueProcessor();
    
    logger.info('📨 Notification System initialized');
    this.emit('initialized');
  }
  
  /**
   * Register channel handlers
   */
  registerChannelHandlers() {
    // Email handler
    this.channelHandlers.set('email', {
      name: 'Email',
      enabled: this.config.channels.email,
      handler: async (notification) => this.sendEmail(notification)
    });
    
    // Webhook handler
    this.channelHandlers.set('webhook', {
      name: 'Webhook',
      enabled: this.config.channels.webhook,
      handler: async (notification) => this.sendWebhook(notification)
    });
    
    // SMS handler
    this.channelHandlers.set('sms', {
      name: 'SMS',
      enabled: this.config.channels.sms,
      handler: async (notification) => this.sendSMS(notification)
    });
    
    // Discord handler
    this.channelHandlers.set('discord', {
      name: 'Discord',
      enabled: this.config.channels.discord,
      handler: async (notification) => this.sendDiscord(notification)
    });
    
    // Microsoft Teams handler
    this.channelHandlers.set('teams', {
      name: 'Microsoft Teams',
      enabled: this.config.channels.teams,
      handler: async (notification) => this.sendTeams(notification)
    });
  }
  
  /**
   * Send notification
   */
  async send(notification) {
    try {
      // Validate notification
      this.validateNotification(notification);
      
      // Add to queue
      const queueItem = {
        id: this.generateNotificationId(),
        ...notification,
        timestamp: new Date().toISOString(),
        status: 'queued',
        attempts: 0
      };
      
      // Check queue size
      if (this.queue.length >= this.config.queueSize) {
        throw new Error('Notification queue is full');
      }
      
      this.queue.push(queueItem);
      this.stats.queued++;
      
      this.emit('notification:queued', queueItem);
      
      // Process immediately if not already processing
      if (!this.processing) {
        this.processQueue();
      }
      
      return queueItem;
      
    } catch (error) {
      logger.error('Failed to queue notification:', error);
      this.emit('notification:error', { notification, error });
      throw error;
    }
  }
  
  /**
   * Send batch notifications
   */
  async sendBatch(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const result = await this.send(notification);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.config.batchSize);
        
        for (const notification of batch) {
          await this.processNotification(notification);
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Process single notification
   */
  async processNotification(notification) {
    try {
      notification.status = 'processing';
      notification.attempts++;
      
      // Apply template if specified
      if (notification.template) {
        notification = await this.applyTemplate(notification);
      }
      
      // Determine channels
      const channels = notification.channels || this.getDefaultChannels(notification);
      
      // Send to each channel
      const results = [];
      for (const channel of channels) {
        const handler = this.channelHandlers.get(channel);
        
        if (!handler || !handler.enabled) {
          logger.debug(`Channel ${channel} is not enabled`);
          continue;
        }
        
        try {
          const result = await handler.handler(notification);
          results.push({ channel, success: true, result });
          
          // Update stats
          this.stats.sent++;
          this.stats.byChannel[channel] = (this.stats.byChannel[channel] || 0) + 1;
          
        } catch (error) {
          results.push({ channel, success: false, error: error.message });
          
          // Retry logic
          if (notification.attempts < this.config.maxRetries) {
            this.queue.push(notification);
            logger.debug(`Retrying notification ${notification.id} (attempt ${notification.attempts})`);
          } else {
            this.stats.failed++;
            logger.error(`Failed to send notification after ${notification.attempts} attempts`);
          }
        }
      }
      
      // Update notification status
      notification.status = results.some(r => r.success) ? 'sent' : 'failed';
      notification.results = results;
      notification.completedAt = new Date().toISOString();
      
      // Add to history
      this.addToHistory(notification);
      
      // Emit event
      this.emit('notification:sent', notification);
      
      return notification;
      
    } catch (error) {
      notification.status = 'error';
      notification.error = error.message;
      this.stats.failed++;
      
      this.emit('notification:failed', { notification, error });
      logger.error('Failed to process notification:', error);
    }
  }
  
  /**
   * Email channel handler
   */
  async sendEmail(notification) {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    logger.info(`📧 Email notification: ${notification.title} to ${notification.recipient}`);
    
    // Simulate email sending
    return {
      messageId: `email_${Date.now()}`,
      recipient: notification.recipient,
      subject: notification.title,
      sent: true
    };
  }
  
  /**
   * Webhook channel handler
   */
  async sendWebhook(notification) {
    if (!notification.webhookUrl && !this.config.defaultWebhook) {
      throw new Error('Webhook URL not configured');
    }
    
    const url = notification.webhookUrl || this.config.defaultWebhook;
    
    const payload = {
      id: notification.id,
      type: 'notification',
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.timestamp
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-BUMBA-Notification': 'true'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }
    
    logger.info(`🔗 Webhook notification sent: ${notification.title}`);
    return { sent: true, url, status: response.status };
  }
  
  /**
   * SMS channel handler
   */
  async sendSMS(notification) {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.info(`📱 SMS notification: ${notification.title} to ${notification.phone}`);
    
    // Simulate SMS sending
    return {
      messageId: `sms_${Date.now()}`,
      recipient: notification.phone,
      message: `${notification.title}: ${notification.message}`.substring(0, 160),
      sent: true
    };
  }
  
  /**
   * Discord channel handler
   */
  async sendDiscord(notification) {
    if (!this.config.discordWebhook) {
      throw new Error('Discord webhook not configured');
    }
    
    const embed = {
      title: notification.title,
      description: notification.message,
      color: this.getSeverityColorHex(notification.severity),
      fields: notification.data ? Object.entries(notification.data).map(([name, value]) => ({
        name,
        value: String(value),
        inline: true
      })) : [],
      timestamp: notification.timestamp,
      footer: { text: 'BUMBA Framework' }
    };
    
    const response = await fetch(this.config.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }
    
    logger.info(`🔴 Discord notification sent: ${notification.title}`);
    return { sent: true, channel: 'discord' };
  }
  
  /**
   * Microsoft Teams channel handler
   */
  async sendTeams(notification) {
    if (!this.config.teamsWebhook) {
      throw new Error('Teams webhook not configured');
    }
    
    const card = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "themeColor": this.getSeverityColorHex(notification.severity).toString(16),
      "summary": notification.title,
      "sections": [{
        "activityTitle": notification.title,
        "activitySubtitle": `Severity: ${notification.severity}`,
        "text": notification.message,
        "facts": notification.data ? Object.entries(notification.data).map(([name, value]) => ({
          name,
          value: String(value)
        })) : []
      }]
    };
    
    const response = await fetch(this.config.teamsWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
    
    if (!response.ok) {
      throw new Error(`Teams API error: ${response.statusText}`);
    }
    
    logger.info(`👥 Teams notification sent: ${notification.title}`);
    return { sent: true, channel: 'teams' };
  }
  
  /**
   * Apply template to notification
   */
  async applyTemplate(notification) {
    const template = this.templates[notification.template];
    
    if (!template) {
      logger.warn(`Template ${notification.template} not found`);
      return notification;
    }
    
    // Merge template with notification
    return {
      ...template,
      ...notification,
      message: this.interpolateTemplate(template.message, notification.data)
    };
  }
  
  /**
   * Interpolate template string
   */
  interpolateTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data && data[key] !== undefined ? data[key] : match;
    });
  }
  
  /**
   * Load notification templates
   */
  async loadTemplates() {
    // Default templates
    this.templates = {
      alert: {
        title: 'System Alert',
        message: 'Alert: {{message}}',
        severity: 'high'
      },
      error: {
        title: 'Error Notification',
        message: 'Error occurred: {{error}}',
        severity: 'critical'
      },
      warning: {
        title: 'Warning',
        message: 'Warning: {{message}}',
        severity: 'medium'
      },
      info: {
        title: 'Information',
        message: '{{message}}',
        severity: 'low'
      },
      success: {
        title: 'Success',
        message: 'Operation successful: {{message}}',
        severity: 'info'
      },
      ...this.config.templates
    };
  }
  
  /**
   * Get default channels based on severity
   */
  getDefaultChannels(notification) {
    const channels = [];
    
    // Critical and high severity go to all enabled channels
    if (['critical', 'high'].includes(notification.severity)) {
      this.channelHandlers.forEach((handler, channel) => {
        if (handler.enabled) channels.push(channel);
      });
    } else {
      // Lower severity only goes to specific channels
      if (this.channelHandlers.get('webhook')?.enabled) channels.push('webhook');
      if (this.channelHandlers.get('email')?.enabled) channels.push('email');
    }
    
    return channels;
  }
  
  /**
   * Get severity color for Slack/Discord
   */
  getSeverityColor(severity) {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: '#FFA500',
      low: '#0099FF',
      info: '#808080'
    };
    return colors[severity] || '#808080';
  }
  
  /**
   * Get severity color in hex
   */
  getSeverityColorHex(severity) {
    const colors = {
      critical: 0xFF0000,
      high: 0xFFA500,
      medium: 0xFFFF00,
      low: 0x0099FF,
      info: 0x808080
    };
    return colors[severity] || 0x808080;
  }
  
  /**
   * Validate notification
   */
  validateNotification(notification) {
    if (!notification.title && !notification.message) {
      throw new Error('Notification must have title or message');
    }
    
    if (!notification.severity) {
      notification.severity = 'info';
    }
    
    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    if (!validSeverities.includes(notification.severity)) {
      throw new Error(`Invalid severity: ${notification.severity}`);
    }
  }
  
  /**
   * Add to delivery history
   */
  addToHistory(notification) {
    this.deliveryHistory.push(notification);
    
    // Trim history
    if (this.deliveryHistory.length > this.maxHistory) {
      this.deliveryHistory = this.deliveryHistory.slice(-this.maxHistory);
    }
  }
  
  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(() => {
      if (this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 1000);
  }
  
  /**
   * Generate notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get notification history
   */
  getHistory(filter = {}) {
    let history = [...this.deliveryHistory];
    
    if (filter.status) {
      history = history.filter(n => n.status === filter.status);
    }
    
    if (filter.channel) {
      history = history.filter(n => 
        n.results?.some(r => r.channel === filter.channel)
      );
    }
    
    if (filter.severity) {
      history = history.filter(n => n.severity === filter.severity);
    }
    
    if (filter.since) {
      history = history.filter(n => 
        new Date(n.timestamp).getTime() > filter.since
      );
    }
    
    return history;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      historySize: this.deliveryHistory.length,
      channels: Array.from(this.channelHandlers.entries()).map(([name, handler]) => ({
        name,
        enabled: handler.enabled,
        sent: this.stats.byChannel[name] || 0
      }))
    };
  }
  
  /**
   * Configure channel
   */
  configureChannel(channel, config) {
    if (channel === 'slack' && config.webhook) {
      this.config.slackWebhook = config.webhook;
      this.channelHandlers.get('slack').enabled = true;
    } else if (channel === 'discord' && config.webhook) {
      this.config.discordWebhook = config.webhook;
      this.channelHandlers.get('discord').enabled = true;
    } else if (channel === 'teams' && config.webhook) {
      this.config.teamsWebhook = config.webhook;
      this.channelHandlers.get('teams').enabled = true;
    } else if (channel === 'webhook' && config.url) {
      this.config.defaultWebhook = config.url;
      this.channelHandlers.get('webhook').enabled = true;
    }
    
    logger.info(`📨 Configured ${channel} channel`);
  }
  
  /**
   * Clear queue
   */
  clearQueue() {
    const cleared = this.queue.length;
    this.queue = [];
    logger.info(`📨 Cleared ${cleared} notifications from queue`);
    return cleared;
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    const cleared = this.deliveryHistory.length;
    this.deliveryHistory = [];
    logger.info(`📨 Cleared ${cleared} notifications from history`);
    return cleared;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  NotificationSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new NotificationSystem(config);
    }
    return instance;
  }
};