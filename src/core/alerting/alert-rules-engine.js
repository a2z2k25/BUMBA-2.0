/**
 * BUMBA Alert Rules Engine
 * Complex alert conditions, correlations, and automated responses
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { alertManager } = require('./alert-manager');

class AlertRulesEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      evaluationInterval: config.evaluationInterval || 5000, // 5 seconds
      maxRuleExecutions: config.maxRuleExecutions || 100,
      enableActions: config.enableActions !== false,
      ...config
    };
    
    // Rules storage
    this.rules = new Map();
    this.ruleGroups = new Map();
    
    // Correlation storage
    this.correlations = new Map();
    this.correlationWindow = config.correlationWindow || 300000; // 5 minutes
    
    // Action handlers
    this.actionHandlers = new Map();
    
    // Evaluation state
    this.evaluating = false;
    this.evaluationInterval = null;
    
    // Statistics
    this.stats = {
      rulesEvaluated: 0,
      rulesTriggered: 0,
      actionsExecuted: 0,
      correlationsFound: 0,
      errors: 0
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize rules engine
   */
  initialize() {
    // Register default action handlers
    this.registerDefaultActions();
    
    // Register default rules
    this.registerDefaultRules();
    
    // Start evaluation if configured
    if (this.config.autoStart) {
      this.startEvaluation();
    }
    
    logger.info('🟢️ Alert Rules Engine initialized');
    this.emit('initialized');
  }
  
  /**
   * Register default action handlers
   */
  registerDefaultActions() {
    // Escalate action
    this.registerAction('escalate', async (context) => {
      const newSeverity = this.escalateSeverity(context.alert.severity);
      
      alertManager.alert(
        `${context.alert.type}_escalated`,
        `ESCALATED: ${context.alert.message}`,
        {
          ...context.alert.data,
          originalSeverity: context.alert.severity,
          escalationReason: context.rule.name
        },
        newSeverity
      );
      
      return { escalated: true, newSeverity };
    });
    
    // Suppress action
    this.registerAction('suppress', async (context) => {
      // Add to suppression list
      this.addSuppression(context.alert.type, context.rule.suppressionDuration || 300000);
      return { suppressed: true };
    });
    
    // Auto-acknowledge action
    this.registerAction('auto_acknowledge', async (context) => {
      const acknowledged = alertManager.acknowledge(
        context.alert.id,
        `auto-${context.rule.name}`
      );
      return { acknowledged };
    });
    
    // Group action
    this.registerAction('group', async (context) => {
      this.addToGroup(context.alert, context.rule.groupName || 'default');
      return { grouped: true };
    });
    
    // Execute command action
    this.registerAction('execute_command', async (context) => {
      if (!context.rule.command) {
        throw new Error('No command specified');
      }
      
      // Security: Only allow safe commands
      const safeCommands = ['restart_service', 'clear_cache', 'rotate_logs'];
      if (!safeCommands.includes(context.rule.command)) {
        throw new Error('Unsafe command');
      }
      
      logger.info(`Executing command: ${context.rule.command}`);
      return { executed: context.rule.command };
    });
    
    // Create ticket action
    this.registerAction('create_ticket', async (context) => {
      const ticket = {
        id: `ticket_${Date.now()}`,
        title: context.alert.message,
        severity: context.alert.severity,
        description: JSON.stringify(context.alert.data, null, 2),
        createdBy: 'AlertRulesEngine',
        rule: context.rule.name
      };
      
      logger.info(`Ticket created: ${ticket.id}`);
      return { ticket };
    });
  }
  
  /**
   * Register default rules
   */
  registerDefaultRules() {
    // Cascade failure detection
    this.addRule({
      name: 'cascade_failure',
      description: 'Detect cascading failures',
      conditions: {
        type: 'correlation',
        alerts: [
          { type: 'service_down', count: 3, window: 60000 },
          { type: 'database_error', count: 1, window: 60000 }
        ]
      },
      actions: ['escalate', 'create_ticket'],
      severity: 'critical',
      enabled: true
    });
    
    // Memory leak detection
    this.addRule({
      name: 'memory_leak_detection',
      description: 'Detect potential memory leaks',
      conditions: {
        type: 'trend',
        metric: 'system.memory.heapUsed',
        trend: 'increasing',
        duration: 300000, // 5 minutes
        threshold: 0.8 // 80% increase
      },
      actions: ['escalate', 'execute_command'],
      command: 'restart_service',
      severity: 'high',
      enabled: true
    });
    
    // Quiet hours suppression
    this.addRule({
      name: 'quiet_hours',
      description: 'Suppress low priority alerts during quiet hours',
      conditions: {
        type: 'time_based',
        schedule: {
          start: '22:00',
          end: '06:00'
        },
        alertSeverity: ['low', 'info']
      },
      actions: ['suppress'],
      suppressionDuration: 28800000, // 8 hours
      enabled: false // Disabled by default
    });
    
    // Repeated alert aggregation
    this.addRule({
      name: 'aggregate_repeated',
      description: 'Group repeated alerts',
      conditions: {
        type: 'frequency',
        alertType: '*',
        count: 5,
        window: 60000 // 1 minute
      },
      actions: ['group', 'auto_acknowledge'],
      groupName: 'repeated_alerts',
      enabled: true
    });
    
    // Critical system component failure
    this.addRule({
      name: 'critical_component_failure',
      description: 'Handle critical component failures',
      conditions: {
        type: 'pattern',
        patterns: [
          { field: 'type', value: 'system_health', match: 'equals' },
          { field: 'severity', value: 'critical', match: 'equals' }
        ]
      },
      actions: ['escalate', 'create_ticket'],
      severity: 'critical',
      enabled: true
    });
  }
  
  /**
   * Add a rule
   */
  addRule(rule) {
    // Validate rule
    this.validateRule(rule);
    
    // Generate ID if not provided
    if (!rule.id) {
      rule.id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Store rule
    this.rules.set(rule.id, {
      ...rule,
      created: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      enabled: rule.enabled !== false
    });
    
    // Add to group if specified
    if (rule.group) {
      if (!this.ruleGroups.has(rule.group)) {
        this.ruleGroups.set(rule.group, new Set());
      }
      this.ruleGroups.get(rule.group).add(rule.id);
    }
    
    logger.debug(`Added rule: ${rule.name}`);
    this.emit('rule:added', rule);
    
    return rule.id;
  }
  
  /**
   * Update a rule
   */
  updateRule(id, updates) {
    const rule = this.rules.get(id);
    
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }
    
    // Update rule
    Object.assign(rule, updates, {
      updated: new Date().toISOString()
    });
    
    logger.debug(`Updated rule: ${rule.name}`);
    this.emit('rule:updated', rule);
  }
  
  /**
   * Remove a rule
   */
  removeRule(id) {
    const rule = this.rules.get(id);
    
    if (!rule) {
      return false;
    }
    
    // Remove from groups
    if (rule.group) {
      const group = this.ruleGroups.get(rule.group);
      if (group) {
        group.delete(id);
      }
    }
    
    // Delete rule
    this.rules.delete(id);
    
    logger.debug(`Removed rule: ${rule.name}`);
    this.emit('rule:removed', rule);
    
    return true;
  }
  
  /**
   * Register an action handler
   */
  registerAction(name, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Action handler must be a function');
    }
    
    this.actionHandlers.set(name, handler);
    logger.debug(`Registered action: ${name}`);
  }
  
  /**
   * Start rule evaluation
   */
  startEvaluation() {
    if (this.evaluating) {
      return;
    }
    
    this.evaluating = true;
    
    // Setup alert listener
    alertManager.on('alert-created', (alert) => {
      this.processAlert(alert);
    });
    
    // Start periodic evaluation for time-based and trend rules
    this.evaluationInterval = setInterval(() => {
      this.evaluatePeriodicRules();
    }, this.config.evaluationInterval);
    
    logger.info('🟢️ Rule evaluation started');
    this.emit('evaluation:started');
  }
  
  /**
   * Stop rule evaluation
   */
  stopEvaluation() {
    if (!this.evaluating) {
      return;
    }
    
    this.evaluating = false;
    
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    
    // Remove alert listener
    alertManager.removeAllListeners('alert-created');
    
    logger.info('🟢️ Rule evaluation stopped');
    this.emit('evaluation:stopped');
  }
  
  /**
   * Process an alert against rules
   */
  async processAlert(alert) {
    // Store for correlation
    this.storeForCorrelation(alert);
    
    // Evaluate all enabled rules
    for (const [id, rule] of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const matches = await this.evaluateRule(rule, alert);
        
        if (matches) {
          await this.executeRule(rule, alert);
        }
        
      } catch (error) {
        this.stats.errors++;
        logger.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
  }
  
  /**
   * Evaluate a rule against an alert
   */
  async evaluateRule(rule, alert) {
    this.stats.rulesEvaluated++;
    
    const conditions = rule.conditions;
    
    switch (conditions.type) {
      case 'pattern':
        return this.evaluatePatternCondition(conditions, alert);
        
      case 'correlation':
        return this.evaluateCorrelationCondition(conditions);
        
      case 'frequency':
        return this.evaluateFrequencyCondition(conditions, alert);
        
      case 'time_based':
        return this.evaluateTimeBasedCondition(conditions, alert);
        
      case 'composite':
        return this.evaluateCompositeCondition(conditions, alert);
        
      case 'custom':
        if (conditions.evaluator && typeof conditions.evaluator === 'function') {
          return conditions.evaluator(alert, this);
        }
        return false;
        
      default:
        logger.warn(`Unknown condition type: ${conditions.type}`);
        return false;
    }
  }
  
  /**
   * Evaluate pattern condition
   */
  evaluatePatternCondition(conditions, alert) {
    if (!conditions.patterns) return false;
    
    return conditions.patterns.every(pattern => {
      const value = this.getNestedValue(alert, pattern.field);
      
      switch (pattern.match) {
        case 'equals':
          return value === pattern.value;
        case 'not_equals':
          return value !== pattern.value;
        case 'contains':
          return String(value).includes(pattern.value);
        case 'regex':
          return new RegExp(pattern.value).test(String(value));
        case 'greater_than':
          return value > pattern.value;
        case 'less_than':
          return value < pattern.value;
        default:
          return false;
      }
    });
  }
  
  /**
   * Evaluate correlation condition
   */
  evaluateCorrelationCondition(conditions) {
    if (!conditions.alerts) return false;
    
    const now = Date.now();
    
    return conditions.alerts.every(alertCondition => {
      const correlatedAlerts = this.correlations.get(alertCondition.type) || [];
      const recentAlerts = correlatedAlerts.filter(a => 
        now - a.timestamp < (alertCondition.window || this.correlationWindow)
      );
      
      return recentAlerts.length >= alertCondition.count;
    });
  }
  
  /**
   * Evaluate frequency condition
   */
  evaluateFrequencyCondition(conditions, alert) {
    const alertType = conditions.alertType === '*' ? alert.type : conditions.alertType;
    
    if (alert.type !== alertType && conditions.alertType !== '*') {
      return false;
    }
    
    const correlatedAlerts = this.correlations.get(alertType) || [];
    const now = Date.now();
    const recentAlerts = correlatedAlerts.filter(a => 
      now - a.timestamp < (conditions.window || 60000)
    );
    
    return recentAlerts.length >= conditions.count;
  }
  
  /**
   * Evaluate time-based condition
   */
  evaluateTimeBasedCondition(conditions, alert) {
    if (!conditions.schedule) return false;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const start = conditions.schedule.start;
    const end = conditions.schedule.end;
    
    // Check if current time is within schedule
    const inSchedule = start <= end 
      ? currentTime >= start && currentTime <= end
      : currentTime >= start || currentTime <= end;
    
    if (!inSchedule) return false;
    
    // Check alert severity if specified
    if (conditions.alertSeverity) {
      return conditions.alertSeverity.includes(alert.severity);
    }
    
    return true;
  }
  
  /**
   * Evaluate composite condition
   */
  async evaluateCompositeCondition(conditions, alert) {
    if (conditions.operator === 'AND') {
      for (const subCondition of conditions.conditions) {
        const subRule = { conditions: subCondition };
        if (!await this.evaluateRule(subRule, alert)) {
          return false;
        }
      }
      return true;
    } else if (conditions.operator === 'OR') {
      for (const subCondition of conditions.conditions) {
        const subRule = { conditions: subCondition };
        if (await this.evaluateRule(subRule, alert)) {
          return true;
        }
      }
      return false;
    }
    
    return false;
  }
  
  /**
   * Evaluate periodic rules (trend, scheduled, etc.)
   */
  async evaluatePeriodicRules() {
    for (const [id, rule] of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        if (rule.conditions.type === 'trend') {
          await this.evaluateTrendRule(rule);
        } else if (rule.conditions.type === 'scheduled') {
          await this.evaluateScheduledRule(rule);
        }
      } catch (error) {
        this.stats.errors++;
        logger.error(`Error in periodic evaluation of rule ${rule.name}:`, error);
      }
    }
  }
  
  /**
   * Evaluate trend rule
   */
  async evaluateTrendRule(rule) {
    // This would integrate with ThresholdMonitor to analyze metric trends
    // Simplified implementation for now
    const conditions = rule.conditions;
    
    if (!conditions.metric) return;
    
    // Get metric history from threshold monitor
    try {
      const { getInstance } = require('./threshold-monitor');
      const monitor = getInstance();
      const history = monitor.getMetricHistory(conditions.metric, conditions.duration);
      
      if (history.length < 2) return;
      
      // Calculate trend
      const values = history.map(h => h.value);
      const trend = this.calculateTrend(values);
      
      let triggered = false;
      
      if (conditions.trend === 'increasing' && trend.slope > 0) {
        triggered = trend.increase >= (conditions.threshold || 0.5);
      } else if (conditions.trend === 'decreasing' && trend.slope < 0) {
        triggered = trend.decrease >= (conditions.threshold || 0.5);
      }
      
      if (triggered) {
        const alert = alertManager.alert(
          `trend_${conditions.metric}`,
          `Trend detected in ${conditions.metric}: ${conditions.trend}`,
          {
            metric: conditions.metric,
            trend: trend,
            rule: rule.name
          },
          rule.severity || 'medium'
        );
        
        if (alert) {
          await this.executeRule(rule, alert);
        }
      }
    } catch (error) {
      logger.debug('Could not evaluate trend rule:', error.message);
    }
  }
  
  /**
   * Execute rule actions
   */
  async executeRule(rule, alert) {
    this.stats.rulesTriggered++;
    
    // Update rule statistics
    rule.lastTriggered = new Date().toISOString();
    rule.triggerCount++;
    
    // Check execution limit
    if (rule.triggerCount > this.config.maxRuleExecutions) {
      logger.warn(`Rule ${rule.name} exceeded execution limit`);
      return;
    }
    
    const context = {
      rule,
      alert,
      engine: this
    };
    
    // Execute actions
    if (this.config.enableActions && rule.actions) {
      for (const action of rule.actions) {
        try {
          const handler = this.actionHandlers.get(action);
          
          if (!handler) {
            logger.warn(`Action handler not found: ${action}`);
            continue;
          }
          
          const result = await handler(context);
          this.stats.actionsExecuted++;
          
          logger.info(`Executed action ${action} for rule ${rule.name}`);
          this.emit('action:executed', { rule, action, result });
          
        } catch (error) {
          this.stats.errors++;
          logger.error(`Failed to execute action ${action}:`, error);
        }
      }
    }
    
    this.emit('rule:triggered', { rule, alert });
  }
  
  /**
   * Store alert for correlation
   */
  storeForCorrelation(alert) {
    if (!this.correlations.has(alert.type)) {
      this.correlations.set(alert.type, []);
    }
    
    const alerts = this.correlations.get(alert.type);
    alerts.push({
      ...alert,
      timestamp: Date.now()
    });
    
    // Clean old correlations
    const cutoff = Date.now() - this.correlationWindow;
    this.correlations.set(
      alert.type,
      alerts.filter(a => a.timestamp > cutoff)
    );
  }
  
  /**
   * Calculate trend from values
   */
  calculateTrend(values) {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const increase = lastValue > firstValue ? (lastValue - firstValue) / firstValue : 0;
    const decrease = lastValue < firstValue ? (firstValue - lastValue) / firstValue : 0;
    
    return { slope, intercept, increase, decrease };
  }
  
  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Escalate severity
   */
  escalateSeverity(currentSeverity) {
    const levels = ['info', 'low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(currentSeverity);
    
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    return 'critical';
  }
  
  /**
   * Add suppression
   */
  addSuppression(alertType, duration) {
    // This would integrate with AlertManager to suppress alerts
    logger.info(`Suppressing ${alertType} for ${duration}ms`);
  }
  
  /**
   * Add alert to group
   */
  addToGroup(alert, groupName) {
    // This would integrate with a grouping mechanism
    logger.info(`Added alert ${alert.id} to group ${groupName}`);
  }
  
  /**
   * Validate rule
   */
  validateRule(rule) {
    if (!rule.name) {
      throw new Error('Rule must have a name');
    }
    
    if (!rule.conditions) {
      throw new Error('Rule must have conditions');
    }
    
    if (!rule.conditions.type) {
      throw new Error('Rule conditions must have a type');
    }
    
    const validTypes = ['pattern', 'correlation', 'frequency', 'time_based', 'trend', 'scheduled', 'composite', 'custom'];
    if (!validTypes.includes(rule.conditions.type)) {
      throw new Error(`Invalid condition type: ${rule.conditions.type}`);
    }
  }
  
  /**
   * Get rule statistics
   */
  getRuleStats(id) {
    const rule = this.rules.get(id);
    
    if (!rule) {
      return null;
    }
    
    return {
      name: rule.name,
      enabled: rule.enabled,
      triggerCount: rule.triggerCount,
      lastTriggered: rule.lastTriggered,
      created: rule.created
    };
  }
  
  /**
   * Get all rule statistics
   */
  getAllRuleStats() {
    const stats = [];
    
    for (const [id, rule] of this.rules) {
      stats.push(this.getRuleStats(id));
    }
    
    return stats;
  }
  
  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      rulesConfigured: this.rules.size,
      rulesEnabled: Array.from(this.rules.values()).filter(r => r.enabled).length,
      actionsRegistered: this.actionHandlers.size,
      correlationTypes: this.correlations.size,
      evaluating: this.evaluating
    };
  }
  
  /**
   * Export rules
   */
  exportRules() {
    const rules = [];
    
    for (const rule of this.rules.values()) {
      rules.push({
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions,
        actions: rule.actions,
        severity: rule.severity,
        group: rule.group,
        enabled: rule.enabled
      });
    }
    
    return rules;
  }
  
  /**
   * Import rules
   */
  importRules(rules) {
    for (const rule of rules) {
      try {
        this.addRule(rule);
      } catch (error) {
        logger.error(`Failed to import rule ${rule.name}:`, error);
      }
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  AlertRulesEngine,
  getInstance: (config) => {
    if (!instance) {
      instance = new AlertRulesEngine(config);
    }
    return instance;
  }
};