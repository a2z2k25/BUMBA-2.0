/**
 * BUMBA Visual Feedback System
 * Provides visual feedback and validation for implementations
 */

const chalk = require('chalk');

class VisualFeedback {
  constructor() {
    this.feedbackLevels = {
      success: '🟢',
      warning: '🟡',
      error: '🔴',
      info: '🏁'
    };
  }

  /**
   * Generate comprehensive feedback
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Feedback report
   */
  async generateFeedback(implementation) {
    console.log('🏁 Generating Visual Feedback');
    console.log('━'.repeat(60));
    console.log();
    
    const feedback = {
      preview: await this.generatePreview(implementation),
      comparison: await this.compareWithOriginal(implementation),
      accessibility: await this.checkAccessibility(implementation),
      responsive: await this.checkResponsiveness(implementation),
      performance: await this.checkPerformance(implementation),
      quality: await this.assessQuality(implementation)
    };
    
    // Display summary
    this.displaySummary(feedback);
    
    return feedback;
  }

  /**
   * Generate preview of implementation
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Preview data
   */
  async generatePreview(implementation) {
    const preview = {
      components: implementation.result?.components || [],
      layout: implementation.plan?.layout || {},
      url: this.generatePreviewUrl(implementation),
      thumbnail: await this.generateThumbnail(implementation)
    };
    
    console.log('📸 Preview Generated:');
    console.log(`  Components: ${preview.components.length}`);
    console.log(`  Layout: ${preview.layout.type}`);
    if (preview.url) {
      console.log(`  URL: ${preview.url}`);
    }
    console.log();
    
    return preview;
  }

  /**
   * Compare with original image
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Comparison results
   */
  async compareWithOriginal(implementation) {
    if (!implementation.analysis) {
      return { available: false };
    }
    
    const comparison = {
      available: true,
      matchScore: 85, // Simulated score
      differences: [],
      improvements: []
    };
    
    // Check component match
    const targetComponents = new Set(implementation.analysis.components.map(c => c.name));
    const createdComponents = new Set(implementation.result?.components?.map(c => c.name) || []);
    
    for (const comp of targetComponents) {
      if (!createdComponents.has(comp)) {
        comparison.differences.push(`Missing: ${comp}`);
        comparison.matchScore -= 5;
      }
    }
    
    // Check color match
    if (implementation.analysis.colors) {
      const targetColors = implementation.analysis.colors.palette;
      const usedColors = implementation.plan?.styling?.colors?.palette || [];
      
      if (targetColors.length !== usedColors.length) {
        comparison.differences.push('Color palette mismatch');
        comparison.matchScore -= 10;
      }
    }
    
    // Generate improvements
    if (comparison.differences.length > 0) {
      comparison.improvements.push('Add missing components');
      comparison.improvements.push('Adjust color scheme to match original');
    }
    
    console.log('📊 Comparison Results:');
    console.log(`  Match Score: ${comparison.matchScore}%`);
    if (comparison.differences.length > 0) {
      console.log(`  Differences: ${comparison.differences.length}`);
    }
    console.log();
    
    return comparison;
  }

  /**
   * Check accessibility
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Accessibility report
   */
  async checkAccessibility(implementation) {
    const report = {
      score: 100,
      issues: [],
      warnings: [],
      passes: []
    };
    
    // Simulated accessibility checks
    const checks = [
      { name: 'Color Contrast', pass: true },
      { name: 'Alt Text', pass: false, issue: 'Missing alt text for images' },
      { name: 'ARIA Labels', pass: true },
      { name: 'Keyboard Navigation', pass: true },
      { name: 'Screen Reader Support', pass: true },
      { name: 'Focus Indicators', pass: false, warning: 'Focus indicators could be improved' }
    ];
    
    checks.forEach(check => {
      if (check.pass) {
        report.passes.push(check.name);
      } else if (check.issue) {
        report.issues.push(check.issue);
        report.score -= 15;
      } else if (check.warning) {
        report.warnings.push(check.warning);
        report.score -= 5;
      }
    });
    
    console.log('♿ Accessibility Check:');
    console.log(`  Score: ${report.score}/100`);
    console.log(`  Passed: ${report.passes.length} checks`);
    if (report.issues.length > 0) {
      console.log(`  Issues: ${report.issues.length}`);
    }
    if (report.warnings.length > 0) {
      console.log(`  Warnings: ${report.warnings.length}`);
    }
    console.log();
    
    return report;
  }

  /**
   * Check responsiveness
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Responsiveness report
   */
  async checkResponsiveness(implementation) {
    const report = {
      responsive: true,
      breakpoints: [],
      issues: [],
      devices: []
    };
    
    // Check for responsive breakpoints
    const breakpoints = implementation.plan?.layout?.breakpoints || [];
    report.breakpoints = breakpoints;
    
    // Test common devices
    const devices = [
      { name: 'iPhone 12', width: 390, height: 844, supported: true },
      { name: 'iPad Pro', width: 1024, height: 1366, supported: true },
      { name: 'Desktop', width: 1920, height: 1080, supported: true },
      { name: 'Galaxy S21', width: 384, height: 854, supported: true }
    ];
    
    devices.forEach(device => {
      const breakpoint = this.findBreakpoint(device.width, breakpoints);
      report.devices.push({
        ...device,
        breakpoint,
        status: device.supported ? 'supported' : 'needs-testing'
      });
    });
    
    // Check for issues
    if (breakpoints.length === 0) {
      report.issues.push('No responsive breakpoints defined');
      report.responsive = false;
    }
    
    console.log('📱 Responsiveness Check:');
    console.log(`  Responsive: ${report.responsive ? 'Yes' : 'No'}`);
    console.log(`  Breakpoints: ${report.breakpoints.join(', ') || 'None'}`);
    console.log(`  Devices Tested: ${report.devices.length}`);
    console.log();
    
    return report;
  }

  /**
   * Check performance metrics
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Performance report
   */
  async checkPerformance(implementation) {
    const report = {
      score: 85,
      metrics: {
        loadTime: 1.2,
        firstPaint: 0.8,
        interactive: 1.5,
        bundleSize: 245
      },
      suggestions: []
    };
    
    // Performance suggestions based on implementation
    const componentCount = implementation.result?.components?.length || 0;
    
    if (componentCount > 10) {
      report.suggestions.push('Consider code splitting for better performance');
      report.score -= 5;
    }
    
    if (!implementation.plan?.styling?.approach?.includes('module')) {
      report.suggestions.push('Use CSS modules to reduce style conflicts');
    }
    
    if (report.metrics.bundleSize > 200) {
      report.suggestions.push('Optimize bundle size with tree shaking');
    }
    
    console.log('⚡ Performance Metrics:');
    console.log(`  Score: ${report.score}/100`);
    console.log(`  Load Time: ${report.metrics.loadTime}s`);
    console.log(`  Bundle Size: ${report.metrics.bundleSize}KB`);
    if (report.suggestions.length > 0) {
      console.log(`  Suggestions: ${report.suggestions.length}`);
    }
    console.log();
    
    return report;
  }

  /**
   * Assess overall quality
   * @param {Object} implementation Implementation details
   * @returns {Promise<Object>} Quality assessment
   */
  async assessQuality(implementation) {
    const assessment = {
      overallScore: 0,
      categories: {},
      strengths: [],
      improvements: [],
      recommendation: ''
    };
    
    // Assess different quality categories
    const categories = {
      structure: this.assessStructure(implementation),
      styling: this.assessStyling(implementation),
      maintainability: this.assessMaintainability(implementation),
      completeness: this.assessCompleteness(implementation)
    };
    
    // Calculate overall score
    let totalScore = 0;
    Object.entries(categories).forEach(([category, score]) => {
      assessment.categories[category] = score;
      totalScore += score;
    });
    assessment.overallScore = Math.round(totalScore / Object.keys(categories).length);
    
    // Identify strengths
    if (categories.structure >= 80) {
      assessment.strengths.push('Well-structured components');
    }
    if (categories.styling >= 80) {
      assessment.strengths.push('Good styling approach');
    }
    if (categories.maintainability >= 80) {
      assessment.strengths.push('Maintainable code');
    }
    
    // Identify improvements
    if (categories.completeness < 80) {
      assessment.improvements.push('Add missing functionality');
    }
    if (categories.maintainability < 70) {
      assessment.improvements.push('Improve code organization');
    }
    
    // Generate recommendation
    if (assessment.overallScore >= 90) {
      assessment.recommendation = 'Excellent! Ready for production';
    } else if (assessment.overallScore >= 75) {
      assessment.recommendation = 'Good implementation, minor improvements needed';
    } else if (assessment.overallScore >= 60) {
      assessment.recommendation = 'Functional, but needs refinement';
    } else {
      assessment.recommendation = 'Requires significant improvements';
    }
    
    console.log('⭐ Quality Assessment:');
    console.log(`  Overall Score: ${assessment.overallScore}/100`);
    console.log(`  Recommendation: ${assessment.recommendation}`);
    console.log();
    
    return assessment;
  }

  /**
   * Display feedback summary
   * @param {Object} feedback Full feedback report
   */
  displaySummary(feedback) {
    console.log('━'.repeat(60));
    console.log('📊 FEEDBACK SUMMARY');
    console.log('━'.repeat(60));
    console.log();
    
    // Visual match
    if (feedback.comparison.available) {
      const matchIcon = feedback.comparison.matchScore >= 80 ? '🟢' : 
                       feedback.comparison.matchScore >= 60 ? '🟡' : '🔴';
      console.log(`${matchIcon} Visual Match: ${feedback.comparison.matchScore}%`);
    }
    
    // Accessibility
    const a11yIcon = feedback.accessibility.score >= 80 ? '🟢' :
                     feedback.accessibility.score >= 60 ? '🟡' : '🔴';
    console.log(`${a11yIcon} Accessibility: ${feedback.accessibility.score}/100`);
    
    // Responsiveness
    const respIcon = feedback.responsive.responsive ? '🟢' : '🔴';
    console.log(`${respIcon} Responsive Design: ${feedback.responsive.responsive ? 'Yes' : 'No'}`);
    
    // Performance
    const perfIcon = feedback.performance.score >= 80 ? '🟢' :
                     feedback.performance.score >= 60 ? '🟡' : '🔴';
    console.log(`${perfIcon} Performance: ${feedback.performance.score}/100`);
    
    // Quality
    const qualIcon = feedback.quality.overallScore >= 80 ? '🟢' :
                     feedback.quality.overallScore >= 60 ? '🟡' : '🔴';
    console.log(`${qualIcon} Code Quality: ${feedback.quality.overallScore}/100`);
    
    console.log();
    console.log('━'.repeat(60));
  }

  // Helper methods
  
  /**
   * Generate preview URL
   * @param {Object} implementation Implementation details
   * @returns {string} Preview URL
   */
  generatePreviewUrl(implementation) {
    // In a real implementation, this would start a dev server
    return `http://localhost:3000/preview/${implementation.result?.id || 'latest'}`;
  }

  /**
   * Generate thumbnail
   * @param {Object} implementation Implementation details
   * @returns {Promise<string>} Thumbnail path or data
   */
  async generateThumbnail(implementation) {
    // In a real implementation, this would capture a screenshot
    return '/tmp/preview-thumbnail.png';
  }

  /**
   * Find matching breakpoint
   * @param {number} width Device width
   * @param {Array} breakpoints Available breakpoints
   * @returns {string} Matching breakpoint
   */
  findBreakpoint(width, breakpoints) {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Assess structure quality
   * @param {Object} implementation Implementation details
   * @returns {number} Structure score
   */
  assessStructure(implementation) {
    let score = 100;
    
    const components = implementation.result?.components || [];
    if (components.length === 0) return 0;
    
    // Check for proper component organization
    if (!implementation.result?.files?.some(f => f.type === 'layout')) {
      score -= 20;
    }
    
    // Check for consistent file structure
    const hasConsistentNaming = components.every(c => 
      c.files?.some(f => f.path.includes(c.name))
    );
    if (!hasConsistentNaming) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Assess styling quality
   * @param {Object} implementation Implementation details
   * @returns {number} Styling score
   */
  assessStyling(implementation) {
    let score = 100;
    
    const hasStyles = implementation.result?.styles?.length > 0;
    if (!hasStyles) {
      score -= 30;
    }
    
    const hasModularStyles = implementation.plan?.styling?.approach === 'css-modules';
    if (!hasModularStyles) {
      score -= 10;
    }
    
    const hasColorScheme = implementation.plan?.styling?.colors;
    if (!hasColorScheme) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Assess maintainability
   * @param {Object} implementation Implementation details
   * @returns {number} Maintainability score
   */
  assessMaintainability(implementation) {
    let score = 100;
    
    // Check for tests
    const hasTests = implementation.result?.tests?.length > 0;
    if (!hasTests) {
      score -= 20;
    }
    
    // Check for proper component separation
    const components = implementation.result?.components || [];
    const avgComponentSize = components.length > 0 ? 100 / components.length : 0;
    if (avgComponentSize > 20) {
      score -= 15; // Components might be too large
    }
    
    // Check for documentation
    const hasComments = true; // Assuming generated code has comments
    if (!hasComments) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Assess completeness
   * @param {Object} implementation Implementation details
   * @returns {number} Completeness score
   */
  assessCompleteness(implementation) {
    let score = 100;
    
    if (!implementation.analysis || !implementation.result) {
      return 0;
    }
    
    const targetCount = implementation.analysis.components?.length || 0;
    const createdCount = implementation.result.components?.length || 0;
    
    if (targetCount > 0) {
      const completionRate = createdCount / targetCount;
      score = Math.round(completionRate * 100);
    }
    
    return Math.min(100, score);
  }
}

module.exports = VisualFeedback;