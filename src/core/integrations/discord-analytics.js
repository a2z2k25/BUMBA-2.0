/**
 * BUMBA Discord Analytics
 * Comprehensive analytics and performance tracking for Discord bot
 * Part of Discord Integration enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Analytics system for Discord bot
 */
class DiscordAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      trackingInterval: config.trackingInterval || 60000, // 1 minute
      retentionPeriod: config.retentionPeriod || 604800000, // 7 days
      aggregationWindow: config.aggregationWindow || 3600000, // 1 hour
      alertsEnabled: config.alertsEnabled !== false,
      realtimeEnabled: config.realtimeEnabled !== false,
      ...config
    };
    
    // Metrics storage
    this.metrics = {
      messages: [],
      commands: [],
      events: [],
      users: new Map(),
      guilds: new Map(),
      channels: new Map(),
      errors: [],
      performance: []
    };
    
    // Real-time tracking
    this.realtime = {
      messagesPerMinute: 0,
      commandsPerMinute: 0,
      activeUsers: new Set(),
      activeGuilds: new Set(),
      currentLatency: 0
    };
    
    // Aggregated stats
    this.aggregated = {
      hourly: new Map(),
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map()
    };
    
    // User analytics
    this.userAnalytics = {
      activity: new Map(),
      engagement: new Map(),
      retention: new Map(),
      behavior: new Map()
    };
    
    // Guild analytics
    this.guildAnalytics = {
      growth: new Map(),
      activity: new Map(),
      health: new Map(),
      features: new Map()
    };
    
    // Command analytics
    this.commandAnalytics = {
      usage: new Map(),
      performance: new Map(),
      errors: new Map(),
      popularity: new Map()
    };
    
    // Channel analytics
    this.channelAnalytics = {
      activity: new Map(),
      types: new Map(),
      engagement: new Map()
    };
    
    // Performance metrics
    this.performanceMetrics = {
      apiLatency: [],
      messageProcessing: [],
      commandExecution: [],
      cachePerformance: [],
      memoryUsage: [],
      cpuUsage: []
    };
    
    // Alerts and thresholds
    this.alerts = {
      thresholds: {
        errorRate: 0.05,
        latency: 500,
        memoryUsage: 0.8,
        cpuUsage: 0.7
      },
      active: []
    };
    
    // Reports
    this.reports = new Map();
    
    // Dashboards
    this.dashboards = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize analytics
   */
  initialize() {
    this.startTracking();
    this.startAggregation();
    this.initializeDashboards();
    
    logger.info('📊 Discord Analytics initialized');
  }
  
  /**
   * Track message
   */
  trackMessage(message) {
    const tracked = {
      id: message.id,
      userId: message.author?.id,
      guildId: message.guild?.id,
      channelId: message.channel?.id,
      content: message.content?.length || 0,
      hasAttachments: !!message.attachments?.size,
      hasEmbeds: !!message.embeds?.length,
      timestamp: Date.now()
    };
    
    this.metrics.messages.push(tracked);
    
    // Update real-time metrics
    this.realtime.messagesPerMinute++;
    this.realtime.activeUsers.add(tracked.userId);
    
    if (tracked.guildId) {
      this.realtime.activeGuilds.add(tracked.guildId);
    }
    
    // Update user analytics
    this.updateUserActivity(tracked.userId);
    
    // Update channel analytics
    this.updateChannelActivity(tracked.channelId);
    
    // Clean old data
    this.cleanOldMessages();
    
    this.emit('message:tracked', tracked);
  }
  
  /**
   * Track command execution
   */
  trackCommand(command, userId, guildId, executionTime) {
    const tracked = {
      command,
      userId,
      guildId,
      executionTime,
      timestamp: Date.now(),
      success: true
    };
    
    this.metrics.commands.push(tracked);
    
    // Update command analytics
    this.updateCommandUsage(command);
    this.updateCommandPerformance(command, executionTime);
    
    // Update real-time metrics
    this.realtime.commandsPerMinute++;
    
    this.emit('command:tracked', tracked);
  }
  
  /**
   * Track command error
   */
  trackCommandError(command, error, userId, guildId) {
    const tracked = {
      command,
      error: error.message,
      userId,
      guildId,
      timestamp: Date.now()
    };
    
    this.metrics.errors.push(tracked);
    
    // Update command error analytics
    this.updateCommandErrors(command);
    
    // Check error rate
    this.checkErrorRate();
    
    this.emit('error:tracked', tracked);
  }
  
  /**
   * Track event
   */
  trackEvent(eventName, data = {}) {
    const tracked = {
      event: eventName,
      data,
      timestamp: Date.now()
    };
    
    this.metrics.events.push(tracked);
    
    this.emit('event:tracked', tracked);
  }
  
  /**
   * Track performance
   */
  trackPerformance(metric, value) {
    const tracked = {
      metric,
      value,
      timestamp: Date.now()
    };
    
    this.performanceMetrics[metric]?.push(tracked);
    
    // Check thresholds
    this.checkPerformanceThresholds(metric, value);
    
    // Update real-time latency
    if (metric === 'apiLatency') {
      this.realtime.currentLatency = value;
    }
    
    this.emit('performance:tracked', tracked);
  }
  
  /**
   * Track user join/leave
   */
  trackUserEvent(event, userId, guildId) {
    const userMetrics = this.getUserMetrics(userId);
    
    if (event === 'join') {
      userMetrics.joinedAt = Date.now();
      userMetrics.guilds.add(guildId);
    } else if (event === 'leave') {
      userMetrics.leftAt = Date.now();
      userMetrics.guilds.delete(guildId);
    }
    
    this.updateUserRetention(userId);
    this.updateGuildGrowth(guildId, event);
    
    this.emit('user:event', { event, userId, guildId });
  }
  
  /**
   * Update user activity
   */
  updateUserActivity(userId) {
    if (!userId) return;
    
    let activity = this.userAnalytics.activity.get(userId);
    
    if (!activity) {
      activity = {
        messages: 0,
        commands: 0,
        lastActive: Date.now(),
        dailyActivity: new Array(24).fill(0),
        weeklyActivity: new Array(7).fill(0)
      };
      
      this.userAnalytics.activity.set(userId, activity);
    }
    
    activity.messages++;
    activity.lastActive = Date.now();
    
    // Update hourly activity
    const hour = new Date().getHours();
    activity.dailyActivity[hour]++;
    
    // Update daily activity
    const day = new Date().getDay();
    activity.weeklyActivity[day]++;
  }
  
  /**
   * Update user engagement
   */
  updateUserEngagement(userId) {
    let engagement = this.userAnalytics.engagement.get(userId);
    
    if (!engagement) {
      engagement = {
        score: 0,
        level: 'new',
        streakDays: 0,
        totalInteractions: 0
      };
      
      this.userAnalytics.engagement.set(userId, engagement);
    }
    
    engagement.totalInteractions++;
    engagement.score = this.calculateEngagementScore(engagement);
    engagement.level = this.determineEngagementLevel(engagement.score);
  }
  
  /**
   * Update user retention
   */
  updateUserRetention(userId) {
    let retention = this.userAnalytics.retention.get(userId);
    
    if (!retention) {
      retention = {
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        daysActive: 1,
        retentionRate: 1
      };
      
      this.userAnalytics.retention.set(userId, retention);
    }
    
    retention.lastSeen = Date.now();
    
    // Calculate days active
    const daysSinceFirst = Math.floor(
      (Date.now() - retention.firstSeen) / 86400000
    );
    
    retention.retentionRate = retention.daysActive / (daysSinceFirst + 1);
  }
  
  /**
   * Update channel activity
   */
  updateChannelActivity(channelId) {
    if (!channelId) return;
    
    let activity = this.channelAnalytics.activity.get(channelId);
    
    if (!activity) {
      activity = {
        messages: 0,
        uniqueUsers: new Set(),
        peakHour: 0,
        averageLength: 0
      };
      
      this.channelAnalytics.activity.set(channelId, activity);
    }
    
    activity.messages++;
    activity.lastActivity = Date.now();
  }
  
  /**
   * Update command usage
   */
  updateCommandUsage(command) {
    let usage = this.commandAnalytics.usage.get(command);
    
    if (!usage) {
      usage = {
        count: 0,
        users: new Set(),
        guilds: new Set(),
        hourlyUsage: new Array(24).fill(0)
      };
      
      this.commandAnalytics.usage.set(command, usage);
    }
    
    usage.count++;
    
    const hour = new Date().getHours();
    usage.hourlyUsage[hour]++;
  }
  
  /**
   * Update command performance
   */
  updateCommandPerformance(command, executionTime) {
    let performance = this.commandAnalytics.performance.get(command);
    
    if (!performance) {
      performance = {
        totalExecutions: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0
      };
      
      this.commandAnalytics.performance.set(command, performance);
    }
    
    performance.totalExecutions++;
    performance.totalTime += executionTime;
    performance.averageTime = performance.totalTime / performance.totalExecutions;
    performance.minTime = Math.min(performance.minTime, executionTime);
    performance.maxTime = Math.max(performance.maxTime, executionTime);
  }
  
  /**
   * Update command errors
   */
  updateCommandErrors(command) {
    let errors = this.commandAnalytics.errors.get(command);
    
    if (!errors) {
      errors = {
        count: 0,
        types: new Map(),
        lastError: Date.now()
      };
      
      this.commandAnalytics.errors.set(command, errors);
    }
    
    errors.count++;
    errors.lastError = Date.now();
  }
  
  /**
   * Update guild growth
   */
  updateGuildGrowth(guildId, event) {
    if (!guildId) return;
    
    let growth = this.guildAnalytics.growth.get(guildId);
    
    if (!growth) {
      growth = {
        members: 0,
        joins: 0,
        leaves: 0,
        netGrowth: 0,
        growthRate: 0
      };
      
      this.guildAnalytics.growth.set(guildId, growth);
    }
    
    if (event === 'join') {
      growth.joins++;
      growth.members++;
    } else if (event === 'leave') {
      growth.leaves++;
      growth.members--;
    }
    
    growth.netGrowth = growth.joins - growth.leaves;
    growth.growthRate = growth.members > 0 ? growth.netGrowth / growth.members : 0;
  }
  
  /**
   * Generate analytics report
   */
  generateReport(type = 'daily', options = {}) {
    const report = {
      id: this.generateReportId(),
      type,
      generated: Date.now(),
      period: options.period || this.getReportPeriod(type),
      data: {}
    };
    
    switch (type) {
      case 'daily':
        report.data = this.generateDailyReport(options);
        break;
        
      case 'weekly':
        report.data = this.generateWeeklyReport(options);
        break;
        
      case 'monthly':
        report.data = this.generateMonthlyReport(options);
        break;
        
      case 'user':
        report.data = this.generateUserReport(options.userId);
        break;
        
      case 'guild':
        report.data = this.generateGuildReport(options.guildId);
        break;
        
      case 'performance':
        report.data = this.generatePerformanceReport(options);
        break;
        
      default:
        report.data = this.generateSummaryReport(options);
    }
    
    this.reports.set(report.id, report);
    
    this.emit('report:generated', report);
    
    return report;
  }
  
  /**
   * Generate daily report
   */
  generateDailyReport(options) {
    const today = new Date().setHours(0, 0, 0, 0);
    
    const todaysMessages = this.metrics.messages.filter(m => 
      m.timestamp >= today
    );
    
    const todaysCommands = this.metrics.commands.filter(c =>
      c.timestamp >= today
    );
    
    return {
      summary: {
        totalMessages: todaysMessages.length,
        totalCommands: todaysCommands.length,
        uniqueUsers: new Set(todaysMessages.map(m => m.userId)).size,
        activeGuilds: new Set(todaysMessages.map(m => m.guildId)).size,
        errors: this.metrics.errors.filter(e => e.timestamp >= today).length
      },
      hourlyBreakdown: this.getHourlyBreakdown(todaysMessages),
      topCommands: this.getTopCommands(todaysCommands, 10),
      topUsers: this.getTopUsers(todaysMessages, 10),
      topChannels: this.getTopChannels(todaysMessages, 10),
      performance: this.getPerformanceStats(today)
    };
  }
  
  /**
   * Generate weekly report
   */
  generateWeeklyReport(options) {
    const weekAgo = Date.now() - 604800000;
    
    const weekMessages = this.metrics.messages.filter(m =>
      m.timestamp >= weekAgo
    );
    
    const weekCommands = this.metrics.commands.filter(c =>
      c.timestamp >= weekAgo
    );
    
    return {
      summary: {
        totalMessages: weekMessages.length,
        totalCommands: weekCommands.length,
        uniqueUsers: new Set(weekMessages.map(m => m.userId)).size,
        activeGuilds: new Set(weekMessages.map(m => m.guildId)).size,
        averageDaily: weekMessages.length / 7,
        growth: this.calculateWeeklyGrowth()
      },
      dailyBreakdown: this.getDailyBreakdown(weekMessages),
      trends: this.calculateWeeklyTrends(),
      userRetention: this.calculateRetentionRate(weekAgo),
      topPerformers: this.getTopPerformers(weekAgo)
    };
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(options) {
    const period = options.period || 3600000; // Last hour
    const since = Date.now() - period;
    
    return {
      apiLatency: this.calculateAverageMetric('apiLatency', since),
      messageProcessing: this.calculateAverageMetric('messageProcessing', since),
      commandExecution: this.calculateAverageMetric('commandExecution', since),
      cachePerformance: this.calculateAverageMetric('cachePerformance', since),
      resourceUsage: {
        memory: this.calculateAverageMetric('memoryUsage', since),
        cpu: this.calculateAverageMetric('cpuUsage', since)
      },
      bottlenecks: this.identifyBottlenecks(since),
      recommendations: this.generatePerformanceRecommendations()
    };
  }
  
  /**
   * Create dashboard
   */
  createDashboard(name, config = {}) {
    const dashboard = {
      id: this.generateDashboardId(),
      name,
      created: Date.now(),
      config,
      widgets: [],
      refreshInterval: config.refreshInterval || 60000
    };
    
    // Add default widgets
    dashboard.widgets = [
      this.createWidget('realtime_stats', {
        type: 'stats',
        metrics: ['messagesPerMinute', 'commandsPerMinute', 'activeUsers']
      }),
      this.createWidget('message_chart', {
        type: 'line',
        metric: 'messages',
        period: 'hour'
      }),
      this.createWidget('top_commands', {
        type: 'bar',
        metric: 'commands',
        limit: 10
      }),
      this.createWidget('performance_gauge', {
        type: 'gauge',
        metrics: ['latency', 'cpu', 'memory']
      }),
      this.createWidget('error_rate', {
        type: 'line',
        metric: 'errors',
        period: 'hour'
      })
    ];
    
    this.dashboards.set(dashboard.id, dashboard);
    
    // Start auto-refresh
    this.startDashboardRefresh(dashboard);
    
    return dashboard;
  }
  
  /**
   * Create widget
   */
  createWidget(name, config) {
    return {
      id: this.generateWidgetId(),
      name,
      config,
      data: null,
      lastUpdate: null
    };
  }
  
  /**
   * Update dashboard
   */
  updateDashboard(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) return;
    
    for (const widget of dashboard.widgets) {
      widget.data = this.getWidgetData(widget);
      widget.lastUpdate = Date.now();
    }
    
    this.emit('dashboard:updated', dashboard);
  }
  
  /**
   * Get widget data
   */
  getWidgetData(widget) {
    const { type, metric, metrics, period, limit } = widget.config;
    
    switch (type) {
      case 'stats':
        return this.getRealtimeStats(metrics);
        
      case 'line':
        return this.getLineChartData(metric, period);
        
      case 'bar':
        return this.getBarChartData(metric, limit);
        
      case 'gauge':
        return this.getGaugeData(metrics);
        
      case 'pie':
        return this.getPieChartData(metric);
        
      default:
        return null;
    }
  }
  
  /**
   * Get real-time stats
   */
  getRealtimeStats(metrics) {
    const stats = {};
    
    for (const metric of metrics) {
      stats[metric] = this.realtime[metric];
    }
    
    return stats;
  }
  
  /**
   * Get line chart data
   */
  getLineChartData(metric, period) {
    const data = this.metrics[metric] || [];
    const since = this.getPeriodTimestamp(period);
    
    return data
      .filter(d => d.timestamp >= since)
      .map(d => ({
        x: d.timestamp,
        y: d.value || 1
      }));
  }
  
  /**
   * Get bar chart data
   */
  getBarChartData(metric, limit) {
    if (metric === 'commands') {
      return this.getTopCommands(this.metrics.commands, limit);
    }
    
    return [];
  }
  
  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(metric, value) {
    const thresholds = {
      apiLatency: this.alerts.thresholds.latency,
      memoryUsage: this.alerts.thresholds.memoryUsage,
      cpuUsage: this.alerts.thresholds.cpuUsage
    };
    
    const threshold = thresholds[metric];
    
    if (threshold && value > threshold) {
      this.raiseAlert({
        type: 'performance',
        metric,
        value,
        threshold,
        message: `${metric} exceeded threshold: ${value} > ${threshold}`
      });
    }
  }
  
  /**
   * Check error rate
   */
  checkErrorRate() {
    const recentErrors = this.metrics.errors.filter(e =>
      e.timestamp > Date.now() - 300000 // Last 5 minutes
    );
    
    const recentCommands = this.metrics.commands.filter(c =>
      c.timestamp > Date.now() - 300000
    );
    
    if (recentCommands.length > 0) {
      const errorRate = recentErrors.length / recentCommands.length;
      
      if (errorRate > this.alerts.thresholds.errorRate) {
        this.raiseAlert({
          type: 'error_rate',
          rate: errorRate,
          threshold: this.alerts.thresholds.errorRate,
          message: `Error rate too high: ${(errorRate * 100).toFixed(2)}%`
        });
      }
    }
  }
  
  /**
   * Raise alert
   */
  raiseAlert(alert) {
    alert.id = this.generateAlertId();
    alert.timestamp = Date.now();
    alert.acknowledged = false;
    
    this.alerts.active.push(alert);
    
    // Keep only recent alerts
    this.alerts.active = this.alerts.active.slice(-100);
    
    this.emit('alert:raised', alert);
    
    logger.warn(`🟠️ Alert: ${alert.message}`);
  }
  
  /**
   * Aggregation
   */
  startAggregation() {
    setInterval(() => {
      this.aggregateHourly();
    }, 3600000); // Every hour
    
    setInterval(() => {
      this.aggregateDaily();
    }, 86400000); // Every day
  }
  
  aggregateHourly() {
    const hour = new Date().getHours();
    const hourAgo = Date.now() - 3600000;
    
    const hourlyData = {
      messages: this.metrics.messages.filter(m => m.timestamp >= hourAgo).length,
      commands: this.metrics.commands.filter(c => c.timestamp >= hourAgo).length,
      errors: this.metrics.errors.filter(e => e.timestamp >= hourAgo).length,
      uniqueUsers: new Set(
        this.metrics.messages
          .filter(m => m.timestamp >= hourAgo)
          .map(m => m.userId)
      ).size
    };
    
    this.aggregated.hourly.set(hour, hourlyData);
  }
  
  aggregateDaily() {
    const today = new Date().toDateString();
    const dayStart = new Date().setHours(0, 0, 0, 0);
    
    const dailyData = {
      messages: this.metrics.messages.filter(m => m.timestamp >= dayStart).length,
      commands: this.metrics.commands.filter(c => c.timestamp >= dayStart).length,
      errors: this.metrics.errors.filter(e => e.timestamp >= dayStart).length,
      uniqueUsers: new Set(
        this.metrics.messages
          .filter(m => m.timestamp >= dayStart)
          .map(m => m.userId)
      ).size
    };
    
    this.aggregated.daily.set(today, dailyData);
  }
  
  /**
   * Cleanup
   */
  cleanOldMessages() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    this.metrics.messages = this.metrics.messages.filter(m =>
      m.timestamp > cutoff
    );
    
    this.metrics.commands = this.metrics.commands.filter(c =>
      c.timestamp > cutoff
    );
    
    this.metrics.errors = this.metrics.errors.filter(e =>
      e.timestamp > cutoff
    );
  }
  
  /**
   * Start tracking
   */
  startTracking() {
    // Reset real-time metrics every minute
    setInterval(() => {
      this.realtime.messagesPerMinute = 0;
      this.realtime.commandsPerMinute = 0;
      this.realtime.activeUsers.clear();
      this.realtime.activeGuilds.clear();
    }, 60000);
  }
  
  /**
   * Start dashboard refresh
   */
  startDashboardRefresh(dashboard) {
    setInterval(() => {
      this.updateDashboard(dashboard.id);
    }, dashboard.refreshInterval);
  }
  
  /**
   * Initialize dashboards
   */
  initializeDashboards() {
    // Create default dashboard
    this.createDashboard('main', {
      refreshInterval: 30000
    });
  }
  
  /**
   * Helper methods
   */
  
  getUserMetrics(userId) {
    if (!this.metrics.users.has(userId)) {
      this.metrics.users.set(userId, {
        userId,
        messages: 0,
        commands: 0,
        guilds: new Set(),
        joinedAt: Date.now()
      });
    }
    
    return this.metrics.users.get(userId);
  }
  
  calculateEngagementScore(engagement) {
    return Math.min(100,
      engagement.totalInteractions * 0.1 +
      engagement.streakDays * 5
    );
  }
  
  determineEngagementLevel(score) {
    if (score < 10) return 'new';
    if (score < 30) return 'casual';
    if (score < 60) return 'regular';
    if (score < 90) return 'active';
    return 'power';
  }
  
  getReportPeriod(type) {
    switch (type) {
      case 'daily':
        return 86400000;
      case 'weekly':
        return 604800000;
      case 'monthly':
        return 2592000000;
      default:
        return 86400000;
    }
  }
  
  getHourlyBreakdown(messages) {
    const breakdown = new Array(24).fill(0);
    
    for (const message of messages) {
      const hour = new Date(message.timestamp).getHours();
      breakdown[hour]++;
    }
    
    return breakdown;
  }
  
  getDailyBreakdown(messages) {
    const breakdown = new Array(7).fill(0);
    
    for (const message of messages) {
      const day = new Date(message.timestamp).getDay();
      breakdown[day]++;
    }
    
    return breakdown;
  }
  
  getTopCommands(commands, limit) {
    const counts = new Map();
    
    for (const cmd of commands) {
      counts.set(cmd.command, (counts.get(cmd.command) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([command, count]) => ({ command, count }));
  }
  
  getTopUsers(messages, limit) {
    const counts = new Map();
    
    for (const msg of messages) {
      if (msg.userId) {
        counts.set(msg.userId, (counts.get(msg.userId) || 0) + 1);
      }
    }
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));
  }
  
  getTopChannels(messages, limit) {
    const counts = new Map();
    
    for (const msg of messages) {
      if (msg.channelId) {
        counts.set(msg.channelId, (counts.get(msg.channelId) || 0) + 1);
      }
    }
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([channelId, count]) => ({ channelId, count }));
  }
  
  getPerformanceStats(since) {
    const stats = {};
    
    for (const [metric, values] of Object.entries(this.performanceMetrics)) {
      const recent = values.filter(v => v.timestamp >= since);
      
      if (recent.length > 0) {
        const vals = recent.map(r => r.value);
        stats[metric] = {
          average: vals.reduce((a, b) => a + b, 0) / vals.length,
          min: Math.min(...vals),
          max: Math.max(...vals),
          count: vals.length
        };
      }
    }
    
    return stats;
  }
  
  calculateWeeklyGrowth() {
    // Calculate growth percentage
    const thisWeek = this.metrics.messages.filter(m =>
      m.timestamp > Date.now() - 604800000
    ).length;
    
    const lastWeek = this.metrics.messages.filter(m =>
      m.timestamp > Date.now() - 1209600000 &&
      m.timestamp < Date.now() - 604800000
    ).length;
    
    if (lastWeek === 0) return 0;
    
    return ((thisWeek - lastWeek) / lastWeek) * 100;
  }
  
  calculateWeeklyTrends() {
    // Identify trends in activity
    const trends = {
      peakDay: null,
      peakHour: null,
      growthTrend: 'stable'
    };
    
    const dailyActivity = this.getDailyBreakdown(
      this.metrics.messages.filter(m =>
        m.timestamp > Date.now() - 604800000
      )
    );
    
    const maxDay = Math.max(...dailyActivity);
    trends.peakDay = dailyActivity.indexOf(maxDay);
    
    const growth = this.calculateWeeklyGrowth();
    if (growth > 10) trends.growthTrend = 'growing';
    if (growth < -10) trends.growthTrend = 'declining';
    
    return trends;
  }
  
  calculateRetentionRate(since) {
    const activeUsers = new Set();
    const returningUsers = new Set();
    
    for (const msg of this.metrics.messages) {
      if (msg.timestamp >= since && msg.userId) {
        activeUsers.add(msg.userId);
        
        // Check if user was active before
        const previousActivity = this.metrics.messages.find(m =>
          m.userId === msg.userId &&
          m.timestamp < since
        );
        
        if (previousActivity) {
          returningUsers.add(msg.userId);
        }
      }
    }
    
    if (activeUsers.size === 0) return 0;
    
    return (returningUsers.size / activeUsers.size) * 100;
  }
  
  getTopPerformers(since) {
    // Get top performing users, channels, and commands
    return {
      users: this.getTopUsers(
        this.metrics.messages.filter(m => m.timestamp >= since),
        5
      ),
      channels: this.getTopChannels(
        this.metrics.messages.filter(m => m.timestamp >= since),
        5
      ),
      commands: this.getTopCommands(
        this.metrics.commands.filter(c => c.timestamp >= since),
        5
      )
    };
  }
  
  calculateAverageMetric(metric, since) {
    const values = this.performanceMetrics[metric]?.filter(v =>
      v.timestamp >= since
    ) || [];
    
    if (values.length === 0) return 0;
    
    return values.reduce((sum, v) => sum + v.value, 0) / values.length;
  }
  
  identifyBottlenecks(since) {
    const bottlenecks = [];
    
    // Check for slow commands
    for (const [command, perf] of this.commandAnalytics.performance) {
      if (perf.averageTime > 1000) {
        bottlenecks.push({
          type: 'slow_command',
          command,
          averageTime: perf.averageTime
        });
      }
    }
    
    // Check for high error rates
    for (const [command, errors] of this.commandAnalytics.errors) {
      const usage = this.commandAnalytics.usage.get(command);
      
      if (usage && errors.count / usage.count > 0.1) {
        bottlenecks.push({
          type: 'high_error_rate',
          command,
          errorRate: errors.count / usage.count
        });
      }
    }
    
    return bottlenecks;
  }
  
  generatePerformanceRecommendations() {
    const recommendations = [];
    
    // Check cache performance
    const cachePerf = this.calculateAverageMetric('cachePerformance', 3600000);
    if (cachePerf < 0.5) {
      recommendations.push('Increase cache size to improve performance');
    }
    
    // Check memory usage
    const memoryUsage = this.calculateAverageMetric('memoryUsage', 3600000);
    if (memoryUsage > 0.7) {
      recommendations.push('Consider optimizing memory usage or scaling resources');
    }
    
    // Check command performance
    for (const [command, perf] of this.commandAnalytics.performance) {
      if (perf.averageTime > 2000) {
        recommendations.push(`Optimize "${command}" command - average execution time is ${perf.averageTime}ms`);
      }
    }
    
    return recommendations;
  }
  
  getPeriodTimestamp(period) {
    const periods = {
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000
    };
    
    return Date.now() - (periods[period] || periods.hour);
  }
  
  getGaugeData(metrics) {
    const data = {};
    
    for (const metric of metrics) {
      if (metric === 'latency') {
        data[metric] = this.realtime.currentLatency;
      } else {
        data[metric] = this.calculateAverageMetric(metric, 60000);
      }
    }
    
    return data;
  }
  
  getPieChartData(metric) {
    // Generate pie chart data based on metric
    if (metric === 'commands') {
      return Array.from(this.commandAnalytics.usage.entries())
        .map(([command, usage]) => ({
          label: command,
          value: usage.count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
    
    return [];
  }
  
  generateUserReport(userId) {
    const activity = this.userAnalytics.activity.get(userId) || {};
    const engagement = this.userAnalytics.engagement.get(userId) || {};
    const retention = this.userAnalytics.retention.get(userId) || {};
    
    return {
      activity,
      engagement,
      retention,
      statistics: {
        totalMessages: activity.messages || 0,
        totalCommands: activity.commands || 0,
        engagementScore: engagement.score || 0,
        retentionRate: retention.retentionRate || 0
      }
    };
  }
  
  generateGuildReport(guildId) {
    const growth = this.guildAnalytics.growth.get(guildId) || {};
    const activity = this.guildAnalytics.activity.get(guildId) || {};
    
    return {
      growth,
      activity,
      health: {
        score: this.calculateGuildHealth(guildId),
        activeUsers: this.getGuildActiveUsers(guildId),
        engagement: this.getGuildEngagement(guildId)
      }
    };
  }
  
  generateSummaryReport(options) {
    return {
      overview: {
        totalMessages: this.metrics.messages.length,
        totalCommands: this.metrics.commands.length,
        totalErrors: this.metrics.errors.length,
        uniqueUsers: this.metrics.users.size,
        activeGuilds: this.realtime.activeGuilds.size
      },
      realtime: { ...this.realtime },
      topMetrics: this.getTopPerformers(3600000),
      alerts: this.alerts.active.slice(-10)
    };
  }
  
  calculateGuildHealth(guildId) {
    // Simple health score calculation
    const messages = this.metrics.messages.filter(m =>
      m.guildId === guildId &&
      m.timestamp > Date.now() - 86400000
    );
    
    const uniqueUsers = new Set(messages.map(m => m.userId)).size;
    const messageCount = messages.length;
    
    return Math.min(100, (uniqueUsers * 10) + (messageCount * 0.1));
  }
  
  getGuildActiveUsers(guildId) {
    const messages = this.metrics.messages.filter(m =>
      m.guildId === guildId &&
      m.timestamp > Date.now() - 86400000
    );
    
    return new Set(messages.map(m => m.userId)).size;
  }
  
  getGuildEngagement(guildId) {
    const messages = this.metrics.messages.filter(m =>
      m.guildId === guildId
    );
    
    const users = new Set(messages.map(m => m.userId)).size;
    
    if (users === 0) return 0;
    
    return messages.length / users;
  }
  
  /**
   * Generate IDs
   */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateDashboardId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateWidgetId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      messages: this.metrics.messages.length,
      commands: this.metrics.commands.length,
      errors: this.metrics.errors.length,
      users: this.metrics.users.size,
      guilds: this.metrics.guilds.size,
      realtime: { ...this.realtime },
      alerts: this.alerts.active.length,
      reports: this.reports.size,
      dashboards: this.dashboards.size
    };
  }
}

module.exports = DiscordAnalytics;