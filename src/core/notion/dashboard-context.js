/**
 * BUMBA Dashboard Context Transfer System
 * Enables smooth handoffs between agents working on dashboards
 * Preserves decisions, customizations, and project knowledge
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class DashboardContext extends EventEmitter {
  constructor(dashboard = {}) {
    super();
    
    this.meta = {
      id: dashboard.id || `dashboard-${Date.now()}`,
      url: dashboard.url || null,
      projectName: dashboard.projectName || 'Unknown Project',
      created: dashboard.created || Date.now(),
      creator: dashboard.creator || 'System',
      lastModified: Date.now(),
      lastModifiedBy: this.getCurrentAgent()
    };
    
    this.structure = {
      sections: dashboard.sections || [],
      customSections: dashboard.customSections || [],
      views: dashboard.views || [],
      departments: dashboard.departments || {}
    };
    
    this.decisions = [];
    this.customizations = dashboard.customizations || [];
    this.activeWork = [];
    this.upcomingTasks = [];
    this.notes = [];
  }

  /**
   * Get current agent name
   */
  getCurrentAgent() {
    return process.env.CURRENT_AGENT || 'Unknown Agent';
  }

  /**
   * Log a decision made about the dashboard
   */
  logDecision(decision) {
    const entry = {
      timestamp: Date.now(),
      agent: this.getCurrentAgent(),
      decision: decision.description,
      reason: decision.reason,
      impact: decision.impact || 'unknown',
      category: decision.category || 'general'
    };
    
    this.decisions.push(entry);
    logger.info(`📝 Decision logged: ${decision.description}`);
    
    this.emit('decision:logged', entry);
    return entry;
  }

  /**
   * Add a note for future agents
   */
  addNote(note) {
    const entry = {
      timestamp: Date.now(),
      agent: this.getCurrentAgent(),
      note,
      priority: note.priority || 'info'
    };
    
    this.notes.push(entry);
    logger.debug(`📌 Note added: ${note.text || note}`);
    
    return entry;
  }

  /**
   * Record active work in progress
   */
  recordActiveWork(work) {
    this.activeWork.push({
      description: work.description,
      startedBy: this.getCurrentAgent(),
      startTime: Date.now(),
      status: work.status || 'in-progress',
      estimatedCompletion: work.estimatedCompletion,
      blockers: work.blockers || []
    });
  }

  /**
   * Add upcoming task for next agent
   */
  addUpcomingTask(task) {
    this.upcomingTasks.push({
      task: task.description,
      priority: task.priority || 'medium',
      suggestedAgent: task.agent,
      reason: task.reason,
      addedBy: this.getCurrentAgent(),
      addedAt: Date.now()
    });
  }

  /**
   * Prepare handoff package for another agent
   */
  async prepareHandoff(toAgent) {
    logger.info(`🤝 Preparing dashboard handoff to ${toAgent}`);
    
    const handoffPackage = {
      meta: this.meta,
      structure: this.structure,
      
      // Context information
      context: {
        projectPhase: this.detectProjectPhase(),
        completionPercentage: this.calculateCompletion(),
        healthStatus: this.assessHealth(),
        lastActivity: this.getLastActivity()
      },
      
      // Historical information
      history: {
        decisions: this.decisions,
        customizations: this.customizations,
        notes: this.notes.filter(n => n.priority === 'high' || n.priority === 'critical')
      },
      
      // Current state
      current: {
        activeWork: this.activeWork.filter(w => w.status === 'in-progress'),
        blockers: this.getBlockers(),
        recentChanges: this.getRecentChanges()
      },
      
      // Future work
      future: {
        upcomingTasks: this.upcomingTasks,
        recommendations: this.generateRecommendations(toAgent)
      },
      
      // Handoff instructions
      instructions: this.generateHandoffInstructions(toAgent),
      
      // Timestamps
      handoffTime: Date.now(),
      handoffFrom: this.getCurrentAgent(),
      handoffTo: toAgent
    };
    
    // Save handoff for audit
    await this.saveHandoff(handoffPackage);
    
    logger.info(`✅ Handoff package prepared with ${this.decisions.length} decisions and ${this.upcomingTasks.length} tasks`);
    
    return handoffPackage;
  }

  /**
   * Detect current project phase
   */
  detectProjectPhase() {
    // Simple heuristic based on completion
    const completion = this.calculateCompletion();
    
    if (completion < 10) return 'initialization';
    if (completion < 30) return 'planning';
    if (completion < 70) return 'development';
    if (completion < 90) return 'testing';
    if (completion < 100) return 'deployment';
    return 'maintenance';
  }

  /**
   * Calculate project completion percentage
   */
  calculateCompletion() {
    // This would connect to actual task tracking
    // For now, return a mock value
    return 35;
  }

  /**
   * Assess dashboard health
   */
  assessHealth() {
    const issues = [];
    
    // Check for staleness
    const hoursSinceUpdate = (Date.now() - this.meta.lastModified) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 24) {
      issues.push('Dashboard may be stale (>24h since update)');
    }
    
    // Check for blockers
    const blockers = this.getBlockers();
    if (blockers.length > 0) {
      issues.push(`${blockers.length} blocker(s) need attention`);
    }
    
    // Check for incomplete work
    const incompleteWork = this.activeWork.filter(w => w.status === 'in-progress').length;
    if (incompleteWork > 3) {
      issues.push(`High WIP count (${incompleteWork} items)`);
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical',
      issues
    };
  }

  /**
   * Get last activity
   */
  getLastActivity() {
    // Combine all timestamped activities
    const activities = [
      ...this.decisions.map(d => ({ ...d, type: 'decision' })),
      ...this.notes.map(n => ({ ...n, type: 'note' })),
      ...this.activeWork.map(w => ({ ...w, timestamp: w.startTime, type: 'work' }))
    ];
    
    // Sort by timestamp and return most recent
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    return activities[0] || null;
  }

  /**
   * Get current blockers
   */
  getBlockers() {
    const blockers = [];
    
    // Check active work for blockers
    this.activeWork.forEach(work => {
      if (work.blockers && work.blockers.length > 0) {
        blockers.push(...work.blockers.map(b => ({
          ...b,
          source: work.description
        })));
      }
    });
    
    return blockers;
  }

  /**
   * Get recent changes
   */
  getRecentChanges() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    
    return {
      decisions: this.decisions.filter(d => d.timestamp > cutoff),
      notes: this.notes.filter(n => n.timestamp > cutoff),
      work: this.activeWork.filter(w => w.startTime > cutoff)
    };
  }

  /**
   * Generate recommendations for specific agent
   */
  generateRecommendations(toAgent) {
    const recommendations = [];
    
    // Agent-specific recommendations
    const agentRecommendations = {
      'Product-Strategist': [
        'Review product requirements alignment',
        'Update stakeholder communication section',
        'Validate business metrics tracking'
      ],
      'Design-Engineer': [
        'Update design mockups in visualization section',
        'Review UI consistency across dashboard',
        'Add user flow diagrams if complex'
      ],
      'Backend-Engineer': [
        'Update API documentation section',
        'Review technical metrics and monitoring',
        'Document architecture decisions'
      ],
      'QA-Specialist': [
        'Add test coverage metrics',
        'Update quality dashboard section',
        'Document testing strategies'
      ]
    };
    
    const specific = agentRecommendations[toAgent] || [];
    recommendations.push(...specific.map(r => ({
      recommendation: r,
      agent: toAgent,
      priority: 'medium'
    })));
    
    // General recommendations based on phase
    const phase = this.detectProjectPhase();
    if (phase === 'development') {
      recommendations.push({
        recommendation: 'Keep progress metrics updated daily',
        priority: 'high'
      });
    } else if (phase === 'testing') {
      recommendations.push({
        recommendation: 'Focus on quality metrics and bug tracking',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate handoff instructions
   */
  generateHandoffInstructions(toAgent) {
    const instructions = [];
    
    // Priority items
    instructions.push('=== PRIORITY ITEMS ===');
    
    // Check for blockers
    const blockers = this.getBlockers();
    if (blockers.length > 0) {
      instructions.push(`1. Address ${blockers.length} blocker(s):`);
      blockers.forEach(b => {
        instructions.push(`   - ${b.description || b}`);
      });
    }
    
    // Active work
    const activeWork = this.activeWork.filter(w => w.status === 'in-progress');
    if (activeWork.length > 0) {
      instructions.push(`2. Continue ${activeWork.length} in-progress item(s):`);
      activeWork.forEach(w => {
        instructions.push(`   - ${w.description}`);
      });
    }
    
    // Upcoming tasks
    if (this.upcomingTasks.length > 0) {
      instructions.push(`3. Upcoming tasks (${this.upcomingTasks.length}):`);
      this.upcomingTasks
        .filter(t => t.priority === 'high')
        .forEach(t => {
          instructions.push(`   - [HIGH] ${t.task}`);
        });
    }
    
    // Context notes
    instructions.push('\n=== CONTEXT NOTES ===');
    
    // Recent decisions
    const recentDecisions = this.decisions.slice(-3);
    if (recentDecisions.length > 0) {
      instructions.push('Recent decisions:');
      recentDecisions.forEach(d => {
        instructions.push(`- ${d.decision} (${d.reason})`);
      });
    }
    
    // High priority notes
    const highNotes = this.notes.filter(n => n.priority === 'high' || n.priority === 'critical');
    if (highNotes.length > 0) {
      instructions.push('\nImportant notes:');
      highNotes.forEach(n => {
        instructions.push(`- [${n.priority.toUpperCase()}] ${n.note}`);
      });
    }
    
    // Agent-specific instructions
    instructions.push(`\n=== FOR ${toAgent.toUpperCase()} ===`);
    const recommendations = this.generateRecommendations(toAgent);
    recommendations.slice(0, 3).forEach(r => {
      instructions.push(`- ${r.recommendation}`);
    });
    
    return instructions.join('\n');
  }

  /**
   * Save handoff for audit trail
   */
  async saveHandoff(handoffPackage) {
    // In production, this would save to a database
    // For now, just log it
    logger.info(`📦 Handoff saved: ${this.getCurrentAgent()} → ${handoffPackage.handoffTo}`);
    
    this.emit('handoff:saved', {
      from: handoffPackage.handoffFrom,
      to: handoffPackage.handoffTo,
      time: handoffPackage.handoffTime
    });
  }

  /**
   * Import context from handoff package
   */
  static fromHandoff(handoffPackage) {
    const context = new DashboardContext({
      id: handoffPackage.meta.id,
      url: handoffPackage.meta.url,
      projectName: handoffPackage.meta.projectName,
      created: handoffPackage.meta.created,
      creator: handoffPackage.meta.creator,
      sections: handoffPackage.structure.sections,
      customSections: handoffPackage.structure.customSections,
      views: handoffPackage.structure.views,
      departments: handoffPackage.structure.departments,
      customizations: handoffPackage.history.customizations
    });
    
    // Import historical data
    context.decisions = handoffPackage.history.decisions || [];
    context.notes = handoffPackage.history.notes || [];
    
    // Import current state
    context.activeWork = handoffPackage.current.activeWork || [];
    context.upcomingTasks = handoffPackage.future.upcomingTasks || [];
    
    // Log handoff receipt
    context.logDecision({
      description: `Received handoff from ${handoffPackage.handoffFrom}`,
      reason: 'Agent transition',
      category: 'handoff'
    });
    
    logger.info(`📥 Context imported from handoff package`);
    
    return context;
  }

  /**
   * Export context as JSON
   */
  toJSON() {
    return {
      meta: this.meta,
      structure: this.structure,
      decisions: this.decisions,
      customizations: this.customizations,
      activeWork: this.activeWork,
      upcomingTasks: this.upcomingTasks,
      notes: this.notes
    };
  }
  
  /**
   * Add context data
   */
  addContext(key, value) {
    if (!this.contextData) {
      this.contextData = {};
    }
    this.contextData[key] = value;
  }
  
  /**
   * Get context data
   */
  getContext(key) {
    if (!this.contextData) {
      return null;
    }
    return this.contextData[key];
  }
}

module.exports = {
  DashboardContext
};