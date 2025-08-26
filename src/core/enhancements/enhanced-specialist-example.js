/**
 * Example: How to enhance an existing specialist with context preservation
 * 
 * This shows how to add CCPM-inspired context preservation to any BUMBA specialist
 * WITHOUT breaking existing functionality.
 */

const UnifiedSpecialistBase = require('../specialists/unified-specialist-base');
const ContextPreservationMixin = require('./context-preservation-mixin');

/**
 * Example: Enhanced Code Reviewer Specialist
 * 
 * This specialist already exists in BUMBA. Here's how to enhance it
 * with context preservation capabilities.
 */
class EnhancedCodeReviewerSpecialist extends UnifiedSpecialistBase {
  constructor(config = {}) {
    // Call parent constructor - preserves all existing functionality
    super({
      ...config,
      id: 'code-reviewer-enhanced',
      name: 'Enhanced Code Reviewer',
      type: 'technical',
      category: 'qa',
      department: 'engineering',
      
      // Existing specialist capabilities
      capabilities: [
        'code-review',
        'bug-detection',
        'security-analysis',
        'performance-review'
      ],
      
      // NEW: Context preservation config
      contextReduction: 0.9, // Target 90% reduction
      maxOutputTokens: 500    // Keep responses concise
    });
    
    // Apply context preservation mixin
    Object.assign(this, ContextPreservationMixin);
    
    // Initialize context preservation
    this.initializeContextPreservation({
      targetReduction: 0.9,
      maxOutputTokens: 500,
      prioritizeCritical: true,
      includeRecommendations: true
    });
    
    // Wrap existing methods with context tracking
    this.wrapMethodsWithContextTracking();
  }
  
  /**
   * Wrap existing execute methods with context tracking
   * This is non-invasive - only adds metrics, doesn't change behavior
   */
  wrapMethodsWithContextTracking() {
    // Store original methods
    const originalExecute = this.executeTask.bind(this);
    const originalAnalyze = this.analyzeCode?.bind(this);
    
    // Wrap executeTask if it exists
    if (originalExecute) {
      this.executeTask = async (task) => {
        return this.executeWithContextTracking(originalExecute, task);
      };
    }
    
    // Wrap analyzeCode if it exists
    if (originalAnalyze) {
      this.analyzeCode = async (code) => {
        const verboseResult = await originalAnalyze(code);
        
        // Apply summarization if needed
        if (this.shouldSummarize(verboseResult)) {
          return this.summarizeCodeReview(verboseResult);
        }
        
        return verboseResult;
      };
    }
  }
  
  /**
   * Domain-specific summarization for code reviews
   * Focuses on critical issues while preserving context
   */
  summarizeCodeReview(verboseReview) {
    const summary = {
      critical: [],
      warnings: [],
      suggestions: [],
      stats: {}
    };
    
    // Extract critical issues
    if (verboseReview.issues) {
      for (const issue of verboseReview.issues) {
        if (issue.severity === 'critical' || issue.severity === 'error') {
          summary.critical.push({
            file: issue.file,
            line: issue.line,
            type: issue.type,
            message: issue.message.substring(0, 100),
            fix: issue.fix
          });
        } else if (issue.severity === 'warning' && summary.warnings.length < 5) {
          summary.warnings.push({
            file: issue.file,
            type: issue.type,
            message: issue.message.substring(0, 80)
          });
        }
      }
    }
    
    // Add key statistics
    summary.stats = {
      filesReviewed: verboseReview.filesReviewed || 0,
      totalIssues: verboseReview.issues?.length || 0,
      criticalCount: summary.critical.length,
      warningCount: summary.warnings.length
    };
    
    // Add top recommendations
    if (verboseReview.recommendations) {
      summary.suggestions = verboseReview.recommendations
        .slice(0, 3)
        .map(r => r.substring(0, 100));
    }
    
    // Track that we generated a summary
    this.contextMetrics.summariesGenerated++;
    
    return summary;
  }
  
  /**
   * Override performTask to add context preservation
   * This shows how to enhance the main execution path
   */
  async performTask(task) {
    // Get verbose result from parent implementation
    const verboseResult = await super.performTask(task);
    
    // If context preservation is enabled and result is large
    if (this.contextMetrics?.enabled && this.shouldSummarize(verboseResult)) {
      // Return summarized version
      return this.applyContextPreservation(verboseResult);
    }
    
    // Otherwise return original result
    return verboseResult;
  }
  
  /**
   * Example: Enhanced code analysis with context preservation
   */
  async analyzeCodeWithContext(codeFiles) {
    const startTokens = this.estimateTokens(codeFiles);
    
    // Perform detailed analysis (this would be verbose)
    const detailedAnalysis = {
      files: [],
      issues: [],
      metrics: {},
      dependencies: [],
      suggestions: []
    };
    
    // Analyze each file (simplified for example)
    for (const file of codeFiles) {
      const fileAnalysis = await this.analyzeFile(file);
      detailedAnalysis.files.push(fileAnalysis);
      detailedAnalysis.issues.push(...fileAnalysis.issues);
    }
    
    // Check if we should summarize
    const resultTokens = this.estimateTokens(detailedAnalysis);
    
    if (resultTokens > this.summarizationConfig.maxOutputTokens) {
      // Create focused summary
      const summary = await this.summarize(detailedAnalysis, {
        prioritizeCritical: true,
        includeRecommendations: true,
        preserveActionItems: true
      });
      
      // Add context metrics to summary
      summary._metrics = {
        filesAnalyzed: codeFiles.length,
        inputTokens: startTokens,
        outputTokens: this.estimateTokens(summary),
        reduction: `${Math.round((1 - this.estimateTokens(summary) / resultTokens) * 100)}%`
      };
      
      return summary;
    }
    
    return detailedAnalysis;
  }
  
  /**
   * Helper: Analyze a single file (simplified)
   */
  async analyzeFile(file) {
    // This would contain actual analysis logic
    return {
      file: file.name,
      issues: [],
      metrics: {
        lines: file.content?.split('\n').length || 0,
        complexity: 1
      }
    };
  }
  
  /**
   * Get specialist info including context metrics
   */
  getSpecialistInfo() {
    const baseInfo = super.getSpecialistInfo?.() || {
      id: this.id,
      name: this.name,
      type: this.type
    };
    
    // Add context preservation metrics
    return {
      ...baseInfo,
      contextPreservation: this.getContextMetrics()
    };
  }
}

/**
 * Example: How to create a factory for enhanced specialists
 */
class EnhancedSpecialistFactory {
  /**
   * Enhance any existing specialist with context preservation
   */
  static enhance(SpecialistClass, contextConfig = {}) {
    return class extends SpecialistClass {
      constructor(config = {}) {
        super(config);
        
        // Apply mixin
        Object.assign(this, ContextPreservationMixin);
        
        // Initialize context preservation
        this.initializeContextPreservation({
          targetReduction: contextConfig.targetReduction || 0.7,
          maxOutputTokens: contextConfig.maxOutputTokens || 500,
          ...contextConfig
        });
        
        // Wrap main execution method
        if (this.executeTask) {
          const original = this.executeTask.bind(this);
          this.executeTask = (task) => this.executeWithContextTracking(original, task);
        }
        
        if (this.performTask) {
          const original = this.performTask.bind(this);
          this.performTask = async (task) => {
            const result = await original(task);
            return this.applyContextPreservation(result);
          };
        }
      }
    };
  }
}

// Example usage:
// const EnhancedDebugger = EnhancedSpecialistFactory.enhance(
//   DebuggerSpecialist, 
//   { targetReduction: 0.95, maxOutputTokens: 300 }
// );

module.exports = {
  EnhancedCodeReviewerSpecialist,
  EnhancedSpecialistFactory
};