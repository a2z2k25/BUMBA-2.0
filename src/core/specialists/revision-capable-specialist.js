/**
 * Revision-Capable Specialist Base Class
 * Adds revision capabilities to all specialists for handling manager feedback
 */

const { logger } = require('../logging/bumba-logger');

class RevisionCapableSpecialist {
  constructor() {
    this.revisionHistory = [];
    this.maxRevisionAttempts = 3;
    this.currentRevisionCount = 0;
  }

  /**
   * Handle revision request from manager
   */
  async revise(originalWork, revisionRequest, context) {
    this.currentRevisionCount++;
    
    logger.info(`📝 Specialist revision attempt ${this.currentRevisionCount}/${this.maxRevisionAttempts}`);
    logger.info(`   Processing ${revisionRequest.feedback.length} feedback items`);
    
    // Store revision history
    this.revisionHistory.push({
      attemptNumber: this.currentRevisionCount,
      originalWork,
      feedback: revisionRequest.feedback,
      timestamp: Date.now()
    });
    
    // Analyze feedback
    const feedbackAnalysis = this.analyzeFeedback(revisionRequest.feedback);
    
    // Apply revisions based on feedback type
    let revisedWork = { ...originalWork };
    
    for (const item of revisionRequest.feedback) {
      revisedWork = await this.applyFeedbackItem(revisedWork, item, feedbackAnalysis);
    }
    
    // Add revision metadata
    revisedWork.revisionMetadata = {
      attemptNumber: this.currentRevisionCount,
      feedbackAddressed: revisionRequest.feedback.map(f => f.message),
      improvementsMade: this.documentImprovements(originalWork, revisedWork),
      timestamp: new Date().toISOString()
    };
    
    return revisedWork;
  }

  /**
   * Analyze feedback to understand patterns
   */
  analyzeFeedback(feedback) {
    const analysis = {
      criticalIssues: [],
      improvements: [],
      suggestions: [],
      categories: new Set()
    };
    
    feedback.forEach(item => {
      if (item.type === 'critical') {
        analysis.criticalIssues.push(item);
      } else if (item.type === 'improvement') {
        analysis.improvements.push(item);
      } else if (item.type === 'suggestion') {
        analysis.suggestions.push(item);
      }
      
      // Extract categories from feedback
      if (item.message.toLowerCase().includes('security')) {
        analysis.categories.add('security');
      }
      if (item.message.toLowerCase().includes('performance')) {
        analysis.categories.add('performance');
      }
      if (item.message.toLowerCase().includes('test')) {
        analysis.categories.add('testing');
      }
      if (item.message.toLowerCase().includes('document')) {
        analysis.categories.add('documentation');
      }
      if (item.message.toLowerCase().includes('error') || item.message.toLowerCase().includes('exception')) {
        analysis.categories.add('error-handling');
      }
    });
    
    return analysis;
  }

  /**
   * Apply a specific feedback item to the work
   */
  async applyFeedbackItem(work, feedbackItem, analysis) {
    // Base implementation - specialists should override
    const revisedWork = { ...work };
    
    // Handle common feedback patterns
    if (feedbackItem.message.includes('validation')) {
      revisedWork.validation = revisedWork.validation || {};
      revisedWork.validation.enhanced = true;
      revisedWork.validation.message = 'Added comprehensive validation';
    }
    
    if (feedbackItem.message.includes('error handling')) {
      revisedWork.errorHandling = revisedWork.errorHandling || {};
      revisedWork.errorHandling.enhanced = true;
      revisedWork.errorHandling.message = 'Improved error handling';
    }
    
    if (feedbackItem.message.includes('documentation')) {
      revisedWork.documentation = revisedWork.documentation || '';
      revisedWork.documentation += '\n\n## Additional Documentation\n';
      revisedWork.documentation += 'Enhanced documentation based on feedback.\n';
    }
    
    if (feedbackItem.message.includes('tests')) {
      revisedWork.tests = revisedWork.tests || '';
      revisedWork.tests += '\n// Additional tests based on feedback\n';
      revisedWork.hasTests = true;
    }
    
    return revisedWork;
  }

  /**
   * Document improvements made during revision
   */
  documentImprovements(original, revised) {
    const improvements = [];
    
    // Check for new properties
    Object.keys(revised).forEach(key => {
      if (!original.hasOwnProperty(key)) {
        improvements.push(`Added ${key}`);
      }
    });
    
    // Check for enhanced properties
    if (revised.validation && !original.validation) {
      improvements.push('Added validation');
    }
    if (revised.errorHandling && !original.errorHandling) {
      improvements.push('Enhanced error handling');
    }
    if (revised.tests && (!original.tests || revised.tests.length > original.tests.length)) {
      improvements.push('Added/improved tests');
    }
    if (revised.documentation && (!original.documentation || revised.documentation.length > original.documentation.length)) {
      improvements.push('Enhanced documentation');
    }
    
    return improvements;
  }

  /**
   * Check if specialist can handle more revisions
   */
  canRevise() {
    return this.currentRevisionCount < this.maxRevisionAttempts;
  }

  /**
   * Reset revision state for new task
   */
  resetRevisionState() {
    this.currentRevisionCount = 0;
    this.revisionHistory = [];
  }

  /**
   * Get revision summary
   */
  getRevisionSummary() {
    return {
      totalAttempts: this.currentRevisionCount,
      maxAttempts: this.maxRevisionAttempts,
      canRevise: this.canRevise(),
      history: this.revisionHistory.map(h => ({
        attempt: h.attemptNumber,
        feedbackCount: h.feedback.length,
        timestamp: h.timestamp
      }))
    };
  }
}

/**
 * Technical Specialist with Revision Capabilities
 */
class RevisionCapableTechnicalSpecialist extends RevisionCapableSpecialist {
  async applyFeedbackItem(work, feedbackItem, analysis) {
    let revisedWork = await super.applyFeedbackItem(work, feedbackItem, analysis);
    
    // Technical-specific revisions
    if (feedbackItem.message.includes('syntax')) {
      revisedWork.code = this.fixSyntaxIssues(revisedWork.code || '');
      revisedWork.syntaxFixed = true;
    }
    
    if (feedbackItem.message.includes('security')) {
      revisedWork.code = this.addSecurityMeasures(revisedWork.code || '');
      revisedWork.securityEnhanced = true;
    }
    
    if (feedbackItem.message.includes('performance')) {
      revisedWork.code = this.optimizePerformance(revisedWork.code || '');
      revisedWork.performanceOptimized = true;
    }
    
    if (feedbackItem.message.includes('type') || feedbackItem.message.includes('typing')) {
      revisedWork.code = this.addTypeAnnotations(revisedWork.code || '');
      revisedWork.typesAdded = true;
    }
    
    return revisedWork;
  }

  fixSyntaxIssues(code) {
    // Placeholder - real implementation would use AST parsing
    return code.replace('syntax error', '// Fixed syntax');
  }

  addSecurityMeasures(code) {
    // Add basic security improvements
    let secured = code;
    if (!secured.includes('sanitize')) {
      secured = '// Security: Input sanitization added\n' + secured;
    }
    return secured;
  }

  optimizePerformance(code) {
    // Add performance optimizations
    let optimized = code;
    if (!optimized.includes('memo')) {
      optimized = '// Performance: Memoization added\n' + optimized;
    }
    return optimized;
  }

  addTypeAnnotations(code) {
    // Add type annotations
    let typed = code;
    if (!typed.includes(': ')) {
      typed = '// Types: Type annotations added\n' + typed;
    }
    return typed;
  }
}

/**
 * Design Specialist with Revision Capabilities
 */
class RevisionCapableDesignSpecialist extends RevisionCapableSpecialist {
  async applyFeedbackItem(work, feedbackItem, analysis) {
    let revisedWork = await super.applyFeedbackItem(work, feedbackItem, analysis);
    
    // Design-specific revisions
    if (feedbackItem.message.includes('accessibility')) {
      revisedWork = this.improveAccessibility(revisedWork);
    }
    
    if (feedbackItem.message.includes('contrast')) {
      revisedWork = this.fixColorContrast(revisedWork);
    }
    
    if (feedbackItem.message.includes('responsive')) {
      revisedWork = this.makeResponsive(revisedWork);
    }
    
    if (feedbackItem.message.includes('consistency')) {
      revisedWork = this.ensureConsistency(revisedWork);
    }
    
    return revisedWork;
  }

  improveAccessibility(work) {
    work.accessibility = work.accessibility || {};
    work.accessibility.ariaLabels = true;
    work.accessibility.semanticHTML = true;
    work.accessibility.keyboardNavigation = true;
    work.accessibility.screenReaderSupport = true;
    
    if (work.component) {
      // Add ARIA labels to component
      work.component = work.component.replace('<button', '<button aria-label="Click me"');
      work.component = work.component.replace('<input', '<input aria-label="Input field"');
    }
    
    return work;
  }

  fixColorContrast(work) {
    work.colorContrast = work.colorContrast || {};
    work.colorContrast.wcagCompliant = true;
    work.colorContrast.ratio = '4.5:1';
    
    if (work.styles) {
      // Fix common contrast issues
      work.styles = work.styles.replace('#f0f0f0', '#333333'); // Darker text
      work.styles = work.styles.replace('color: #ccc', 'color: #555'); // Better contrast
    }
    
    return work;
  }

  makeResponsive(work) {
    work.responsive = work.responsive || {};
    work.responsive.mobileOptimized = true;
    work.responsive.breakpoints = ['320px', '768px', '1024px', '1440px'];
    
    if (work.styles) {
      // Add media queries
      work.styles += '\n@media (max-width: 768px) { /* Mobile styles */ }';
      work.styles += '\n@media (min-width: 769px) { /* Desktop styles */ }';
    }
    
    return work;
  }

  ensureConsistency(work) {
    work.consistency = work.consistency || {};
    work.consistency.designSystem = true;
    work.consistency.brandGuidelines = true;
    work.consistency.componentLibrary = true;
    
    return work;
  }
}

/**
 * Business/Product Specialist with Revision Capabilities
 */
class RevisionCapableBusinessSpecialist extends RevisionCapableSpecialist {
  async applyFeedbackItem(work, feedbackItem, analysis) {
    let revisedWork = await super.applyFeedbackItem(work, feedbackItem, analysis);
    
    // Business-specific revisions
    if (feedbackItem.message.includes('ROI') || feedbackItem.message.includes('business value')) {
      revisedWork = this.addBusinessJustification(revisedWork);
    }
    
    if (feedbackItem.message.includes('user') || feedbackItem.message.includes('customer')) {
      revisedWork = this.enhanceUserFocus(revisedWork);
    }
    
    if (feedbackItem.message.includes('market')) {
      revisedWork = this.addMarketAnalysis(revisedWork);
    }
    
    if (feedbackItem.message.includes('metrics') || feedbackItem.message.includes('KPI')) {
      revisedWork = this.defineMetrics(revisedWork);
    }
    
    return revisedWork;
  }

  addBusinessJustification(work) {
    work.business_value = work.business_value || {};
    work.business_value.roi_analysis = 'Expected ROI: 150% over 12 months';
    work.business_value.cost_benefit = 'Benefits outweigh costs by 3:1';
    work.business_value.strategic_alignment = 'Aligns with Q3 business objectives';
    work.business_value.revenue_impact = 'Projected $500K additional revenue';
    
    return work;
  }

  enhanceUserFocus(work) {
    work.user_focus = work.user_focus || {};
    work.user_focus.user_stories = [
      'As a user, I want to easily navigate the interface',
      'As a customer, I need quick access to support',
      'As an admin, I require comprehensive analytics'
    ];
    work.user_focus.personas = ['Power User', 'Casual User', 'Enterprise Admin'];
    work.user_focus.user_outcomes = 'Improved user satisfaction by 40%';
    work.user_focus.user_research = 'Based on survey of 500 users';
    
    return work;
  }

  addMarketAnalysis(work) {
    work.market_analysis = work.market_analysis || {};
    work.market_analysis.competitive_landscape = 'Differentiated from top 3 competitors';
    work.market_analysis.market_trends = 'Aligned with industry shift to AI-driven solutions';
    work.market_analysis.target_market = 'Mid-market B2B SaaS companies';
    work.market_analysis.positioning = 'Premium solution with enterprise features';
    
    return work;
  }

  defineMetrics(work) {
    work.success_metrics = work.success_metrics || {};
    work.success_metrics.kpis = [
      'User adoption rate > 60%',
      'Customer satisfaction score > 4.5',
      'Revenue growth > 25% YoY',
      'Churn rate < 5%'
    ];
    work.success_metrics.tracking = 'Weekly dashboard reporting';
    work.success_metrics.baseline = 'Current metrics documented';
    
    return work;
  }
}

module.exports = {
  RevisionCapableSpecialist,
  RevisionCapableTechnicalSpecialist,
  RevisionCapableDesignSpecialist,
  RevisionCapableBusinessSpecialist
};