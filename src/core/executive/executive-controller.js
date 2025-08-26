/**
 * Executive Controller
 * Central control system for executive mode and operations
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');
const { ExecutiveMonitoringDebugger } = require('./monitoring-debugger');

/**
 * Executive modes
 */
const ExecutiveMode = {
  STRATEGIC: 'strategic',
  OPERATIONAL: 'operational',
  TACTICAL: 'tactical',
  CRISIS: 'crisis',
  MAINTENANCE: 'maintenance'
};

/**
 * Authority levels
 */
const AuthorityLevel = {
  FULL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LIMITED: 2,
  RESTRICTED: 1
};

class ExecutiveController extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableContextManagement: true,
      enableOverrideAuthority: true,
      enableAuditTrail: true,
      defaultMode: ExecutiveMode.OPERATIONAL,
      defaultAuthority: AuthorityLevel.MEDIUM,
      ...config
    };
    
    // Controller state
    this.currentMode = this.config.defaultMode;
    this.authorityLevel = this.config.defaultAuthority;
    this.context = new Map();
    this.overrides = new Map();
    this.auditTrail = [];
    
    // Mode configurations
    this.modeConfigs = this.initializeModeConfigs();
    
    // Performance monitoring
    this.performanceMetrics = {
      modeChanges: 0,
      overridesExecuted: 0,
      contextSwitches: 0,
      auditEntries: 0
    };
    
    this.initializeController();
    
    logger.info('🔴 Executive Controller initialized');
  }

  initializeModeConfigs() {
    return {
      [ExecutiveMode.STRATEGIC]: {
        authority: AuthorityLevel.FULL,
        capabilities: ['vision_setting', 'long_term_planning', 'major_decisions'],
        restrictions: [],
        timeout: null
      },
      [ExecutiveMode.OPERATIONAL]: {
        authority: AuthorityLevel.HIGH,
        capabilities: ['daily_operations', 'resource_allocation', 'team_management'],
        restrictions: ['major_policy_changes'],
        timeout: null
      },
      [ExecutiveMode.TACTICAL]: {
        authority: AuthorityLevel.MEDIUM,
        capabilities: ['tactical_decisions', 'short_term_planning', 'optimization'],
        restrictions: ['strategic_changes', 'major_investments'],
        timeout: 3600000 // 1 hour
      },
      [ExecutiveMode.CRISIS]: {
        authority: AuthorityLevel.FULL,
        capabilities: ['emergency_response', 'override_all', 'rapid_decision'],
        restrictions: [],
        timeout: 7200000 // 2 hours
      },
      [ExecutiveMode.MAINTENANCE]: {
        authority: AuthorityLevel.RESTRICTED,
        capabilities: ['monitoring', 'reporting', 'minor_adjustments'],
        restrictions: ['major_decisions', 'resource_changes', 'policy_updates'],
        timeout: null
      }
    };
  }

  initializeController() {
    // Apply initial mode configuration
    this.applyModeConfiguration(this.currentMode);
    
    // Initialize monitoring and debugging
    this.monitoringDebugger = new ExecutiveMonitoringDebugger({
      enableMonitoring: true,
      enableDebugging: true,
      enableTracing: true,
      debugLevel: 2 // INFO level
    });
    
    // Start monitoring
    this.startMonitoring();
    
    // Initialize context
    this.initializeContext();
  }

  /**
   * Switch executive mode
   */
  async switchMode(newMode, reason = '') {
    if (!Object.values(ExecutiveMode).includes(newMode)) {
      throw new Error(`Invalid mode: ${newMode}`);
    }
    
    const previousMode = this.currentMode;
    
    // Validate mode transition
    const validation = await this.validateModeTransition(previousMode, newMode);
    if (!validation.valid) {
      throw new Error(`Mode transition not allowed: ${validation.reason}`);
    }
    
    // Save current context
    if (this.config.enableContextManagement) {
      await this.saveContext(previousMode);
    }
    
    // Switch mode
    this.currentMode = newMode;
    this.applyModeConfiguration(newMode);
    
    // Load new context
    if (this.config.enableContextManagement) {
      await this.loadContext(newMode);
    }
    
    // Update metrics
    this.performanceMetrics.modeChanges++;
    
    // Audit trail
    if (this.config.enableAuditTrail) {
      this.addAuditEntry({
        action: 'mode_switch',
        from: previousMode,
        to: newMode,
        reason,
        timestamp: Date.now()
      });
    }
    
    // Emit event
    this.emit('mode:changed', {
      previousMode,
      newMode,
      reason,
      authority: this.authorityLevel
    });
    
    logger.info(`🔄 Executive mode switched: ${previousMode} → ${newMode}`);
    
    return {
      success: true,
      mode: newMode,
      authority: this.authorityLevel
    };
  }

  /**
   * Validate mode transition
   */
  async validateModeTransition(fromMode, toMode) {
    // Crisis mode can be activated from any mode
    if (toMode === ExecutiveMode.CRISIS) {
      return { valid: true };
    }
    
    // Cannot transition from crisis to maintenance directly
    if (fromMode === ExecutiveMode.CRISIS && toMode === ExecutiveMode.MAINTENANCE) {
      return { 
        valid: false, 
        reason: 'Must transition through operational mode first' 
      };
    }
    
    // Strategic mode requires high authority
    if (toMode === ExecutiveMode.STRATEGIC && this.authorityLevel < AuthorityLevel.HIGH) {
      return { 
        valid: false, 
        reason: 'Insufficient authority for strategic mode' 
      };
    }
    
    return { valid: true };
  }

  /**
   * Apply mode configuration
   */
  applyModeConfiguration(mode) {
    const config = this.modeConfigs[mode];
    
    // Set authority level
    this.authorityLevel = config.authority;
    
    // Set timeout if specified
    if (config.timeout) {
      this.setModeTimeout(mode, config.timeout);
    }
    
    // Apply capabilities and restrictions
    this.currentCapabilities = config.capabilities;
    this.currentRestrictions = config.restrictions;
  }

  /**
   * Set mode timeout
   */
  setModeTimeout(mode, timeout) {
    if (this.modeTimeout) {
      clearTimeout(this.modeTimeout);
    }
    
    this.modeTimeout = setTimeout(() => {
      logger.warn(`Mode timeout reached for ${mode}, switching to operational`);
      this.switchMode(ExecutiveMode.OPERATIONAL, 'timeout');
    }, timeout);
  }

  /**
   * Manage context
   */
  async saveContext(mode) {
    const context = {
      mode,
      timestamp: Date.now(),
      state: this.captureCurrentState(),
      metrics: { ...this.performanceMetrics }
    };
    
    this.context.set(mode, context);
    this.performanceMetrics.contextSwitches++;
    
    logger.debug(`Context saved for mode: ${mode}`);
  }

  async loadContext(mode) {
    const context = this.context.get(mode);
    
    if (context) {
      // Restore relevant state
      this.restoreState(context.state);
      logger.debug(`Context loaded for mode: ${mode}`);
    } else {
      // Initialize new context
      this.initializeContext();
      logger.debug(`New context initialized for mode: ${mode}`);
    }
  }

  initializeContext() {
    this.contextState = {
      activeOperations: [],
      pendingDecisions: [],
      resources: {},
      priorities: []
    };
  }

  captureCurrentState() {
    return {
      ...this.contextState,
      timestamp: Date.now()
    };
  }

  restoreState(state) {
    this.contextState = {
      ...state,
      restored: true,
      restoredAt: Date.now()
    };
  }

  /**
   * Execute override
   */
  async executeOverride(action, params = {}, reason = '') {
    if (!this.config.enableOverrideAuthority) {
      throw new Error('Override authority is disabled');
    }
    
    // Check authority level
    if (this.authorityLevel < AuthorityLevel.HIGH) {
      throw new Error('Insufficient authority for override');
    }
    
    const overrideId = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const override = {
      id: overrideId,
      action,
      params,
      reason,
      executedBy: 'executive_controller',
      timestamp: Date.now(),
      mode: this.currentMode,
      authority: this.authorityLevel
    };
    
    // Store override
    this.overrides.set(overrideId, override);
    
    // Execute action
    const result = await this.executeAction(action, params);
    override.result = result;
    
    // Update metrics
    this.performanceMetrics.overridesExecuted++;
    
    // Audit trail
    if (this.config.enableAuditTrail) {
      this.addAuditEntry({
        action: 'override_executed',
        overrideId,
        details: override
      });
    }
    
    // Emit event
    this.emit('override:executed', override);
    
    logger.warn(`🟠️ Override executed: ${action} (${reason})`);
    
    return {
      success: true,
      overrideId,
      result
    };
  }

  /**
   * Execute action
   */
  async executeAction(action, params) {
    // Check if action is allowed in current mode
    if (this.currentRestrictions.includes(action)) {
      throw new Error(`Action restricted in current mode: ${action}`);
    }
    
    // Simulate action execution
    return {
      action,
      params,
      executed: true,
      timestamp: Date.now()
    };
  }

  /**
   * Add audit trail entry
   */
  addAuditEntry(entry) {
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
      timestamp: entry.timestamp || Date.now(),
      mode: this.currentMode,
      authority: this.authorityLevel
    };
    
    this.auditTrail.push(auditEntry);
    this.performanceMetrics.auditEntries++;
    
    // Keep audit trail size manageable
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(-10000);
    }
    
    this.emit('audit:entry', auditEntry);
    
    return auditEntry;
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters = {}) {
    let trail = [...this.auditTrail];
    
    // Apply filters
    if (filters.action) {
      trail = trail.filter(e => e.action === filters.action);
    }
    
    if (filters.mode) {
      trail = trail.filter(e => e.mode === filters.mode);
    }
    
    if (filters.startTime) {
      trail = trail.filter(e => e.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      trail = trail.filter(e => e.timestamp <= filters.endTime);
    }
    
    // Sort by timestamp (newest first)
    trail.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    if (filters.limit) {
      trail = trail.slice(0, filters.limit);
    }
    
    return trail;
  }

  /**
   * Check capability
   */
  hasCapability(capability) {
    return this.currentCapabilities.includes(capability);
  }

  /**
   * Check restriction
   */
  isRestricted(action) {
    return this.currentRestrictions.includes(action);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      mode: this.currentMode,
      authority: this.authorityLevel,
      capabilities: this.currentCapabilities,
      restrictions: this.currentRestrictions,
      contextAvailable: this.context.size,
      overridesActive: this.overrides.size,
      auditEntries: this.auditTrail.length
    };
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    // Monitor system health
    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Every 30 seconds
  }

  /**
   * Check system health
   */
  checkSystemHealth() {
    // Check for crisis conditions
    const crisisIndicators = this.detectCrisisIndicators();
    
    if (crisisIndicators.length > 0 && this.currentMode !== ExecutiveMode.CRISIS) {
      logger.warn('Crisis indicators detected:', crisisIndicators);
      this.emit('crisis:detected', { indicators: crisisIndicators });
      
      // Auto-switch to crisis mode if configured
      if (this.config.autoSwitchToCrisis) {
        this.switchMode(ExecutiveMode.CRISIS, 'auto_crisis_detection');
      }
    }
  }

  /**
   * Detect crisis indicators
   */
  detectCrisisIndicators() {
    const indicators = [];
    
    // Check various crisis conditions
    // This would be connected to real monitoring in production
    if (Math.random() < 0.01) { // 1% chance for demo
      indicators.push('system_failure');
    }
    
    if (Math.random() < 0.02) { // 2% chance for demo
      indicators.push('security_breach');
    }
    
    return indicators;
  }

  /**
   * Performance monitoring
   */
  async monitorPerformance() {
    const metrics = {
      ...this.performanceMetrics,
      currentMode: this.currentMode,
      authority: this.authorityLevel,
      uptime: Date.now() - this.startTime,
      contextSize: this.context.size,
      overridesCount: this.overrides.size
    };
    
    this.emit('performance:metrics', metrics);
    
    return metrics;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      metrics: { ...this.performanceMetrics },
      currentMode: this.currentMode,
      authorityLevel: this.authorityLevel,
      contextSize: this.context.size,
      overridesCount: this.overrides.size,
      auditTrailSize: this.auditTrail.length
    };
  }

  /**
   * Shutdown controller
   */
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.modeTimeout) {
      clearTimeout(this.modeTimeout);
    }
    
    // Save final audit entry
    if (this.config.enableAuditTrail) {
      this.addAuditEntry({
        action: 'shutdown',
        reason: 'controller_shutdown'
      });
    }
    
    logger.info('🔌 Executive Controller shut down');
  }
}

module.exports = {
  ExecutiveController,
  ExecutiveMode,
  AuthorityLevel
};