/**
 * BUMBA Real Validation Framework
 * Evidence-based validation with actionable feedback
 * 
 * SOLVES: Managers "validate" but don't actually validate anything meaningful
 * RESULT: Real validation with proof, line numbers, and fixes
 */

const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');

/**
 * Issue severity levels
 */
const SEVERITY = {
  ERROR: { level: 3, name: 'Error', icon: '❌', color: 'red' },
  WARNING: { level: 2, name: 'Warning', icon: '⚠️', color: 'yellow' },
  INFO: { level: 1, name: 'Info', icon: 'ℹ️', color: 'blue' },
  STYLE: { level: 0, name: 'Style', icon: '💅', color: 'gray' }
};

/**
 * Validation categories
 */
const CATEGORIES = {
  SYNTAX: 'Syntax',
  LOGIC: 'Logic',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
  BEST_PRACTICE: 'Best Practice',
  COMPATIBILITY: 'Compatibility',
  DOCUMENTATION: 'Documentation'
};

/**
 * Evidence types
 */
const EVIDENCE_TYPES = {
  LINE: 'line',
  RANGE: 'range',
  FILE: 'file',
  PATTERN: 'pattern'
};

/**
 * Validation Evidence
 */
class ValidationEvidence {
  constructor(issue, location, explanation, suggestedFix, severity = SEVERITY.WARNING) {
    this.issue = issue;
    this.location = location;
    this.explanation = explanation;
    this.suggestedFix = suggestedFix;
    this.severity = severity;
    this.category = this.categorizeIssue(issue);
    this.confidence = 1.0;
    this.evidence = [];
  }
  
  /**
   * Categorize the issue
   */
  categorizeIssue(issue) {
    const lower = issue.toLowerCase();
    
    if (lower.includes('syntax') || lower.includes('parse')) {
      return CATEGORIES.SYNTAX;
    }
    if (lower.includes('undefined') || lower.includes('null') || lower.includes('logic')) {
      return CATEGORIES.LOGIC;
    }
    if (lower.includes('injection') || lower.includes('xss') || lower.includes('security')) {
      return CATEGORIES.SECURITY;
    }
    if (lower.includes('performance') || lower.includes('slow') || lower.includes('memory')) {
      return CATEGORIES.PERFORMANCE;
    }
    if (lower.includes('deprecated') || lower.includes('compatibility')) {
      return CATEGORIES.COMPATIBILITY;
    }
    if (lower.includes('comment') || lower.includes('docs')) {
      return CATEGORIES.DOCUMENTATION;
    }
    
    return CATEGORIES.BEST_PRACTICE;
  }
  
  /**
   * Add supporting evidence
   */
  addEvidence(type, data) {
    this.evidence.push({ type, data });
    return this;
  }
  
  /**
   * Set confidence level (0-1)
   */
  setConfidence(confidence) {
    this.confidence = Math.max(0, Math.min(1, confidence));
    return this;
  }
  
  /**
   * Format for display
   */
  format() {
    let output = `${this.severity.icon} ${chalk[this.severity.color](this.issue)}\n`;
    output += `   Location: ${this.formatLocation()}\n`;
    output += `   Category: ${this.category}\n`;
    output += `   Why: ${this.explanation}\n`;
    
    if (this.suggestedFix) {
      output += `   Fix: ${chalk.green(this.suggestedFix)}\n`;
    }
    
    if (this.confidence < 1) {
      output += `   Confidence: ${(this.confidence * 100).toFixed(0)}%\n`;
    }
    
    return output;
  }
  
  /**
   * Format location
   */
  formatLocation() {
    if (typeof this.location === 'object') {
      if (this.location.line) {
        return `Line ${this.location.line}${this.location.column ? `:${this.location.column}` : ''}`;
      }
      if (this.location.start && this.location.end) {
        return `Lines ${this.location.start}-${this.location.end}`;
      }
    }
    return this.location;
  }
}

/**
 * Validation Result
 */
class ValidationResult {
  constructor(target, type = 'code') {
    this.target = target;
    this.type = type;
    this.valid = true;
    this.evidence = [];
    this.stats = {
      errors: 0,
      warnings: 0,
      info: 0,
      style: 0
    };
    this.confidence = 0;
    this.limitations = [];
    this.metadata = {
      validator: 'BUMBA',
      timestamp: Date.now(),
      duration: 0
    };
    this.startTime = Date.now();
  }
  
  /**
   * Add evidence of an issue
   */
  addEvidence(issue, lineNumber, explanation, suggestedFix, severity = SEVERITY.WARNING) {
    const evidence = new ValidationEvidence(
      issue,
      { line: lineNumber },
      explanation,
      suggestedFix,
      severity
    );
    
    this.evidence.push(evidence);
    
    // Update stats
    switch(severity) {
      case SEVERITY.ERROR:
        this.stats.errors++;
        this.valid = false;
        break;
      case SEVERITY.WARNING:
        this.stats.warnings++;
        break;
      case SEVERITY.INFO:
        this.stats.info++;
        break;
      case SEVERITY.STYLE:
        this.stats.style++;
        break;
    }
    
    return evidence;
  }
  
  /**
   * Add a syntax error
   */
  addSyntaxError(line, message, fix = null) {
    return this.addEvidence(
      'Syntax Error',
      line,
      message,
      fix,
      SEVERITY.ERROR
    );
  }
  
  /**
   * Add a logic error
   */
  addLogicError(line, issue, explanation, fix = null) {
    return this.addEvidence(
      issue,
      line,
      explanation,
      fix,
      SEVERITY.ERROR
    );
  }
  
  /**
   * Add a security issue
   */
  addSecurityIssue(line, vulnerability, explanation, fix) {
    const evidence = this.addEvidence(
      `Security: ${vulnerability}`,
      line,
      explanation,
      fix,
      SEVERITY.ERROR
    );
    evidence.category = CATEGORIES.SECURITY;
    return evidence;
  }
  
  /**
   * Add a performance issue
   */
  addPerformanceIssue(line, issue, impact, fix = null) {
    return this.addEvidence(
      `Performance: ${issue}`,
      line,
      impact,
      fix,
      SEVERITY.WARNING
    );
  }
  
  /**
   * Add a best practice violation
   */
  addBestPractice(line, practice, why, fix = null) {
    return this.addEvidence(
      `Best Practice: ${practice}`,
      line,
      why,
      fix,
      SEVERITY.INFO
    );
  }
  
  /**
   * Add a limitation (something we couldn't check)
   */
  addLimitation(what, why) {
    this.limitations.push({ what, why });
  }
  
  /**
   * Calculate confidence score
   */
  calculateConfidence() {
    if (this.evidence.length === 0) {
      // No issues found - either perfect or we couldn't validate
      this.confidence = this.limitations.length > 0 ? 0.3 : 0.9;
    } else {
      // Confidence based on evidence quality
      const avgConfidence = this.evidence.reduce((sum, e) => sum + e.confidence, 0) / this.evidence.length;
      const limitationPenalty = this.limitations.length * 0.1;
      this.confidence = Math.max(0.1, avgConfidence - limitationPenalty);
    }
    
    return this.confidence;
  }
  
  /**
   * Finalize the validation
   */
  finalize() {
    this.metadata.duration = Date.now() - this.startTime;
    this.calculateConfidence();
    return this;
  }
  
  /**
   * Check if validation passed
   */
  isValid() {
    return this.valid && this.stats.errors === 0;
  }
  
  /**
   * Get severity level
   */
  getSeverity() {
    if (this.stats.errors > 0) return SEVERITY.ERROR;
    if (this.stats.warnings > 0) return SEVERITY.WARNING;
    if (this.stats.info > 0) return SEVERITY.INFO;
    return SEVERITY.STYLE;
  }
  
  /**
   * Get actionable fixes
   */
  getActionableFixes() {
    return this.evidence
      .filter(e => e.suggestedFix)
      .map(e => ({
        location: e.location,
        issue: e.issue,
        fix: e.suggestedFix,
        severity: e.severity.name
      }));
  }
  
  /**
   * Get issues by category
   */
  getIssuesByCategory() {
    const categories = {};
    
    this.evidence.forEach(e => {
      if (!categories[e.category]) {
        categories[e.category] = [];
      }
      categories[e.category].push(e);
    });
    
    return categories;
  }
  
  /**
   * Get critical issues (errors only)
   */
  getCriticalIssues() {
    return this.evidence.filter(e => e.severity === SEVERITY.ERROR);
  }
  
  /**
   * Format as report
   */
  formatReport() {
    let report = chalk.cyan.bold('\n╔══════════════════════════════════════════════════════╗\n');
    report += chalk.cyan.bold('║            VALIDATION REPORT                         ║\n');
    report += chalk.cyan.bold('╚══════════════════════════════════════════════════════╝\n\n');
    
    report += `Target: ${this.target}\n`;
    report += `Type: ${this.type}\n`;
    report += `Valid: ${this.isValid() ? chalk.green('✓ Yes') : chalk.red('✗ No')}\n`;
    report += `Confidence: ${(this.confidence * 100).toFixed(0)}%\n\n`;
    
    // Statistics
    report += chalk.yellow('Statistics:\n');
    report += `  Errors: ${this.stats.errors}\n`;
    report += `  Warnings: ${this.stats.warnings}\n`;
    report += `  Info: ${this.stats.info}\n`;
    report += `  Style: ${this.stats.style}\n\n`;
    
    // Issues by category
    if (this.evidence.length > 0) {
      report += chalk.yellow('Issues Found:\n\n');
      
      const byCategory = this.getIssuesByCategory();
      Object.entries(byCategory).forEach(([category, issues]) => {
        report += chalk.cyan(`${category}:\n`);
        issues.forEach(issue => {
          report += issue.format() + '\n';
        });
      });
    } else {
      report += chalk.green('No issues found!\n\n');
    }
    
    // Actionable fixes
    const fixes = this.getActionableFixes();
    if (fixes.length > 0) {
      report += chalk.yellow('Actionable Fixes:\n');
      fixes.forEach((fix, index) => {
        report += `${index + 1}. ${fix.issue} at ${this.formatLocation(fix.location)}\n`;
        report += `   ${chalk.green('→')} ${fix.fix}\n`;
      });
      report += '\n';
    }
    
    // Limitations
    if (this.limitations.length > 0) {
      report += chalk.gray('Limitations:\n');
      this.limitations.forEach(lim => {
        report += `  • Could not check ${lim.what}: ${lim.why}\n`;
      });
      report += '\n';
    }
    
    report += chalk.gray(`\nValidation took ${this.metadata.duration}ms\n`);
    
    return report;
  }
  
  /**
   * Format location helper
   */
  formatLocation(location) {
    if (typeof location === 'object' && location.line) {
      return `line ${location.line}`;
    }
    return location;
  }
  
  /**
   * Export as JSON
   */
  toJSON() {
    return {
      target: this.target,
      type: this.type,
      valid: this.isValid(),
      confidence: this.confidence,
      stats: this.stats,
      evidence: this.evidence.map(e => ({
        issue: e.issue,
        location: e.location,
        category: e.category,
        severity: e.severity.name,
        explanation: e.explanation,
        fix: e.suggestedFix,
        confidence: e.confidence
      })),
      limitations: this.limitations,
      metadata: this.metadata
    };
  }
}

/**
 * Real Validator implementations
 */
class JavaScriptValidator {
  async validate(code, options = {}) {
    const result = new ValidationResult('JavaScript Code', 'javascript');
    const lines = code.split('\n');
    
    // Check for common issues with evidence
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Syntax issues
      if (line.includes('=') && !line.includes('==') && !line.includes('=>')) {
        const match = line.match(/if\s*\([^)]*=[^=]/);
        if (match) {
          result.addSyntaxError(
            lineNum,
            'Assignment in condition instead of comparison',
            'Use === for comparison'
          );
        }
      }
      
      // Security issues
      if (line.includes('eval(')) {
        result.addSecurityIssue(
          lineNum,
          'eval() usage',
          'eval() executes arbitrary code and is a security risk',
          'Use JSON.parse() for JSON or Function constructor for dynamic code'
        );
      }
      
      if (line.includes('innerHTML') && line.includes('=')) {
        result.addSecurityIssue(
          lineNum,
          'innerHTML assignment',
          'Direct innerHTML assignment can lead to XSS attacks',
          'Use textContent for text or sanitize HTML before insertion'
        );
      }
      
      // Logic issues
      if (line.match(/==\s*null/)) {
        result.addLogicError(
          lineNum,
          'Loose null comparison',
          'Using == with null also matches undefined',
          'Use === null for strict null check'
        );
      }
      
      // Performance issues
      if (line.includes('document.querySelector') || line.includes('document.getElementById')) {
        // Check if we're in a loop context (simple heuristic)
        const prevLines = lines.slice(Math.max(0, index - 3), index);
        const nextLines = lines.slice(index, Math.min(lines.length, index + 3));
        const nearbyLines = [...prevLines, ...nextLines];
        
        if (nearbyLines.some(l => l.includes('for') || l.includes('while'))) {
          result.addPerformanceIssue(
            lineNum,
            'DOM query in loop',
            'Querying DOM in a loop is expensive',
            'Cache the element reference outside the loop'
          );
        }
      }
      
      // Best practices
      if (line.includes('var ')) {
        result.addBestPractice(
          lineNum,
          'var usage',
          'var has function scope and can cause issues',
          'Use const or let instead'
        );
      }
      
      if (line.match(/console\.(log|error|warn)/)) {
        result.addEvidence(
          'Console statement',
          lineNum,
          'Console statements should be removed in production',
          'Remove or use a proper logging library',
          SEVERITY.STYLE
        );
      }
    });
    
    // Check for missing semicolons (style)
    lines.forEach((line, index) => {
      if (line.trim() && 
          !line.trim().endsWith(';') && 
          !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') &&
          !line.includes('//') &&
          !line.trim().startsWith('*')) {
        result.addEvidence(
          'Missing semicolon',
          index + 1,
          'JavaScript statements should end with semicolons',
          'Add semicolon at end of line',
          SEVERITY.STYLE
        ).setConfidence(0.7);
      }
    });
    
    // Add limitations
    if (!options.withAST) {
      result.addLimitation('Deep syntax analysis', 'AST parsing not available');
    }
    
    if (!options.withTypeCheck) {
      result.addLimitation('Type checking', 'TypeScript not configured');
    }
    
    return result.finalize();
  }
}

/**
 * Validator Factory
 */
class ValidatorFactory {
  static getValidator(type) {
    switch(type.toLowerCase()) {
      case 'javascript':
      case 'js':
        return new JavaScriptValidator();
      default:
        throw new Error(`No validator for type: ${type}`);
    }
  }
  
  static async validate(code, type, options = {}) {
    const validator = this.getValidator(type);
    return await validator.validate(code, options);
  }
}

module.exports = {
  ValidationResult,
  ValidationEvidence,
  ValidatorFactory,
  JavaScriptValidator,
  SEVERITY,
  CATEGORIES
};