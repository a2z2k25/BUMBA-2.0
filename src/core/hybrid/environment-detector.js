/**
 * BUMBA Environment Detection System
 * Detects whether running in Claude, terminal, or VSCode
 */

class EnvironmentDetector {
  /**
   * Main detection method
   * @returns {Object} Environment details with mode and capabilities
   */
  static detect() {
    return {
      mode: this.getMode(),
      capabilities: this.getCapabilities(),
      context: this.getContext(),
      platform: this.getPlatform()
    };
  }

  /**
   * Detect current environment mode
   * @returns {string} 'claude' | 'terminal' | 'vscode'
   */
  static getMode() {
    // Check for Claude-specific environment indicators
    if (this.inClaude()) {
      return 'claude';
    }
    
    // Check for VSCode terminal
    if (process.env.TERM_PROGRAM === 'vscode') {
      return 'vscode';
    }
    
    // Default to terminal
    return 'terminal';
  }

  /**
   * Check if running in Claude environment
   * @returns {boolean}
   */
  static inClaude() {
    // Multiple detection methods for Claude environment
    return !!(
      process.env.CLAUDE_CODE ||
      process.env.ANTHROPIC_ENV ||
      global.__claude__ ||
      (typeof process !== 'undefined' && process.claude)
    );
  }

  /**
   * Get environment capabilities based on mode
   * @returns {Object} Capability flags
   */
  static getCapabilities() {
    const mode = this.getMode();
    
    return {
      vision: mode === 'claude',
      ai: mode === 'claude',
      multiAgent: mode === 'claude',
      filesystem: true,
      realtime: mode === 'claude',
      taskPreparation: mode !== 'claude',
      contextGathering: true,
      commandExecution: true,
      interactivePrompts: mode !== 'claude',
      parallelExecution: mode === 'claude'
    };
  }

  /**
   * Get execution context information
   * @returns {Object} Context details
   */
  static getContext() {
    return {
      cwd: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };
  }

  /**
   * Get platform-specific information
   * @returns {Object} Platform details
   */
  static getPlatform() {
    return {
      os: process.platform,
      shell: process.env.SHELL || 'unknown',
      terminal: process.env.TERM || 'unknown',
      colorSupport: this.hasColorSupport(),
      unicodeSupport: this.hasUnicodeSupport()
    };
  }

  /**
   * Check for color support in terminal
   * @returns {boolean}
   */
  static hasColorSupport() {
    return !!(
      process.stdout.isTTY &&
      process.env.TERM &&
      process.env.TERM !== 'dumb'
    );
  }

  /**
   * Check for Unicode support
   * @returns {boolean}
   */
  static hasUnicodeSupport() {
    return process.platform !== 'win32' || process.env.CI || process.env.WT_SESSION;
  }

  /**
   * Generate unique session ID
   * @returns {string}
   */
  static generateSessionId() {
    return `bumba_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get detailed environment report
   * @returns {Object} Complete environment analysis
   */
  static getReport() {
    const env = this.detect();
    
    return {
      ...env,
      hybrid: {
        ready: true,
        version: '3.0.0',
        modes: {
          bridge: env.mode === 'terminal',
          enhancement: env.mode === 'claude',
          hybrid: true
        }
      },
      recommendations: this.getRecommendations(env.mode)
    };
  }

  /**
   * Get mode-specific recommendations
   * @param {string} mode Current mode
   * @returns {Array} List of recommendations
   */
  static getRecommendations(mode) {
    const recommendations = [];
    
    if (mode === 'terminal') {
      recommendations.push('Use "bumba prepare" to set up tasks for Claude');
      recommendations.push('Run "bumba analyze" to gather project context');
      recommendations.push('Consider switching to Claude for AI features');
    } else if (mode === 'claude') {
      recommendations.push('Use /bumba:execute to run prepared tasks');
      recommendations.push('Vision capabilities are available');
      recommendations.push('Multi-agent orchestration is enabled');
    }
    
    return recommendations;
  }
}

module.exports = EnvironmentDetector;